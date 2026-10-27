"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRealtimeConversation } from "@/components/conversation-realtime-provider";
import { Editor } from "@/components/editor/editor";
import type { MentionUser } from "@/components/editor/mentions";
import { useRealtimeTeam } from "@/components/team-realtime-provider";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useRequiredConversationScope } from "@/hooks/use-conversation-scope";
import { conversationKey } from "@/lib/conversation";
import { orpc } from "@/lib/orpc";
import type { InfiniteMessages } from "@/lib/types";
import { getShortcutModifierLabel } from "@/lib/utils";
import {
  type MessageListItemType,
  type UpdateMessageSchemaType,
  updateMessageSchema,
} from "../../schema";
import { AttachmentChip } from "./attachment-chip";
import { ImageUploadDialog } from "./image-dialog";

interface EditMessageFormProps {
  message: MessageListItemType;
  onCancel: () => void;
  onSave: () => void;
}

export function EditMessageForm({
  message,
  onCancel,
  onSave,
}: EditMessageFormProps) {
  const scope = useRequiredConversationScope();
  const { send } = useRealtimeConversation();
  const { teamId } = useParams();

  const form = useForm<UpdateMessageSchemaType>({
    resolver: zodResolver(updateMessageSchema),
    defaultValues: {
      content: message.content,
      messageId: message.id,
      // Keep the existing attachment visible while the message is being edited.
      imageUrl: message.imageUrl ?? undefined,
    },
    mode: "onChange",
  });

  const queryClient = useQueryClient();

  const { data: membersData } = useQuery(
    orpc.team.members.list.queryOptions({ input: { teamId } })
  );

  const mentionsQuery = useCallback(
    (query: string) => {
      const members = membersData?.members;
      if (!members?.length) {
        return [];
      }

      const normalizedQuery = query.toLowerCase();
      return members
        .filter(
          (member) =>
            member.name.toLowerCase().includes(normalizedQuery) ||
            (member.email?.toLowerCase().includes(normalizedQuery) ?? false)
        )
        .slice(0, 8)
        .map(
          (member): MentionUser => ({
            id: member.id,
            name: member.name,
            email: member.email,
            image: member.image ?? undefined,
          })
        );
    },
    [membersData]
  );

  // Must stay in sync with the key MessageList registers its infinite query under.
  const messageListKey = conversationKey(scope);

  const updateMessageMutation = useMutation(
    orpc.message.update.mutationOptions({
      onMutate: async (variables) => {
        // Stop any in-flight refetches so they don't overwrite the optimistic value.
        await queryClient.cancelQueries({ queryKey: messageListKey });

        // Snapshot current data so we can roll back if the server rejects the edit.
        const prevData =
          queryClient.getQueryData<InfiniteMessages>(messageListKey);

        // Immediately apply the new content in the cache — this is the optimistic update.
        queryClient.setQueryData<InfiniteMessages>(messageListKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) =>
                msg.id === variables.messageId
                  ? {
                      ...msg,
                      content: variables.content,
                      imageUrl:
                        variables.imageUrl === undefined
                          ? msg.imageUrl
                          : variables.imageUrl,
                    }
                  : msg
              ),
            })),
          };
        });

        return { prevData };
      },

      onSuccess: (update) => {
        // If this message is the parent of an open thread, the right sidebar
        // uses a separate `message.threads.list` query keyed by message id.
        // Invalidate it so the sidebar re-fetches and shows the updated content.
        queryClient.invalidateQueries(
          orpc.message.threads.list.queryOptions({
            input: { threadId: update.message.id },
          })
        );

        toast.success("Message updated successfully");
        send({
          type: "message:updated",
          payload: {
            message: {
              id: update.message.id,
              createdAt: update.message.createdAt,
              updatedAt: update.message.updatedAt,
              teamId: update.message.teamId,
              channelId: update.message.channelId,
              threadId: update.message.threadId,
              content: update.message.content,
              imageUrl: update.message.imageUrl ?? null,
              user: message.user,
              repliesCount: message.repliesCount ?? 0,
            },
          },
        });

        onSave();
      },

      onError: (error, _variables, context) => {
        // Roll back the optimistic update to the snapshot taken in onMutate.
        if (context?.prevData) {
          queryClient.setQueryData(messageListKey, context.prevData);
        }
        toast.error("Failed to update message", {
          description: error.message,
        });
      },

      onSettled: () => {
        // Ensure eventual consistency: re-sync the cache with the server
        // regardless of success or failure, once the mutation is done.
        queryClient.invalidateQueries({ queryKey: messageListKey });
      },
    })
  );

  function onSubmit(values: UpdateMessageSchemaType) {
    updateMessageMutation.mutate(values);
  }

  return (
    <form id="update-message-form" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="imageUrl"
          render={({ field: imageField }) => (
            <Controller
              control={form.control}
              name="content"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Editor
                    field={{ value: field.value, onChange: field.onChange }}
                    mentionsQuery={mentionsQuery}
                    onSubmit={form.handleSubmit(onSubmit)}
                    footerLeft={
                      imageField.value ? (
                        <AttachmentChip
                          url={imageField.value}
                          onDelete={() => imageField.onChange(null)}
                          onChangeComplete={(url) => imageField.onChange(url)}
                        />
                      ) : (
                        <ImageUploadDialog
                          onUploadComplete={(url) => imageField.onChange(url)}
                        >
                          <Button size="sm" variant="outline" type="button">
                            Attach
                          </Button>
                        </ImageUploadDialog>
                      )
                    }
                    sendButton={
                      <div className="flex items-center gap-4">
                        <Button
                          size="sm"
                          disabled={updateMessageMutation.isPending}
                        >
                          {updateMessageMutation.isPending
                            ? "Updating..."
                            : "Update"}
                          <KbdGroup className="hidden sm:flex">
                            <Kbd>{getShortcutModifierLabel()}</Kbd>
                            <Kbd>↵</Kbd>
                          </KbdGroup>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={updateMessageMutation.isPending}
                          onClick={onCancel}
                        >
                          Cancel
                        </Button>
                      </div>
                    }
                  />
                </Field>
              )}
            />
          )}
        />
      </FieldGroup>
    </form>
  );
}
