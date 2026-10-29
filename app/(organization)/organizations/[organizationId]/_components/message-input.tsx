/* eslint-disable react-hooks/incompatible-library */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRealtimeConversation } from "@/components/conversation-realtime-provider";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { useConversationErrorRecovery } from "@/hooks/use-conversation-error-recovery";
import { useMentionUsers } from "@/hooks/use-mention-users";
import type { ConversationScope } from "@/lib/conversation";
import { conversationKey } from "@/lib/conversation";
import { orpc } from "@/lib/orpc";
import type { InfiniteMessages } from "@/lib/types";
import {
  type CreateMessageType,
  createMessageSchema,
  type MessageListItemType,
} from "../../schema";
import { MessageComposer } from "./message-composer";

interface MessageInputProps {
  scope: ConversationScope;
}

export function MessageInput({ scope }: MessageInputProps) {
  const [editorKey, setEditorKey] = useState(0);

  const { send } = useRealtimeConversation();
  const recoverFromDeletedChannel = useConversationErrorRecovery(scope);
  const messageListKey = conversationKey(scope);

  const form = useForm<CreateMessageType>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      content: "",
      scope,
      imageUrl: undefined,
    },
    mode: "onChange",
  });

  const imageUrl = form.watch("imageUrl");

  const queryclient = useQueryClient();

  const { users, currentUser } = useMentionUsers(scope);

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (variables) => {
        // Stop any outgoing refetches so they don't overwrite the optimistic update.
        await queryclient.cancelQueries({
          queryKey: messageListKey,
        });

        // Snapshot the current cache so we can roll back on error.
        const prevData =
          queryclient.getQueryData<InfiniteMessages>(messageListKey);

        // Build a fake message that matches MessageItem exactly so the UI
        // renders it immediately without waiting for the server round-trip.
        const tempId = `optimistic-${crypto.randomUUID()}`;
        const optimisticMessage: MessageListItemType = {
          id: tempId,
          content: variables.content,
          imageUrl: variables.imageUrl ?? null,
          createdAt: new Date(),
          // New messages have no replies yet; required by MessageItem's shape.
          repliesCount: 0,
          reactions: [],
          // Use the real session user so the avatar / name look correct.
          user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            image: currentUser.image ?? null,
          },
        };

        // Inject the optimistic message at the front of the first page.
        // The raw cache stores pages newest-first (orderBy: createdAt DESC),
        // so index-0 is the most-recent page — exactly where the new message belongs.
        if (prevData) {
          queryclient.setQueryData<InfiniteMessages>(messageListKey, {
            ...prevData,
            pages: [
              {
                ...prevData.pages[0],
                messages: [
                  optimisticMessage,
                  ...(prevData.pages[0]?.messages ?? []),
                ],
              },
              ...prevData.pages.slice(1),
            ],
          });
        }

        // Return snapshot and tempId so onSuccess can replace the fake entry
        // with the real server-assigned ID before invalidation fires.
        return { prevData, tempId };
      },
      onSuccess: (createdMessage, _variables, context) => {
        // Swap the fake optimistic ID for the real server-assigned ID
        if (context?.tempId) {
          queryclient.setQueryData<InfiniteMessages>(messageListKey, (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                messages: page.messages.map((msg) =>
                  msg.id === context.tempId
                    ? {
                        ...msg,
                        // Replace the fake id and server-assigned timestamp
                        id: createdMessage.id,
                        createdAt: createdMessage.createdAt,
                      }
                    : msg
                ),
              })),
            };
          });
        }

        setEditorKey((prev) => prev + 1);
        form.reset({ scope, content: "", imageUrl: undefined });
        form.setValue("imageUrl", undefined);

        // Invalidate using the same key the infinite query is stored under.
        queryclient.invalidateQueries({
          queryKey: messageListKey,
        });

        send({
          type: "message:created",
          payload: {
            message: {
              ...createdMessage,
              // mentionedUserIds: createdMessage.mentionedUserIds,
              user: {
                id: currentUser.id,
                name: currentUser.name,
                image: currentUser.image ?? null,
                email: currentUser.email,
              },
              repliesCount: 0,
            },
          },
        });

        toast.success("Message sent successfully");
      },
      onError: (error, _variables, context) => {
        // Roll back to the pre-optimistic snapshot if we have one.
        if (context?.prevData) {
          queryclient.setQueryData(messageListKey, context.prevData);
        }
        if (recoverFromDeletedChannel(error)) return;
        toast.error("Something bad happened, please try again!", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  function onSubmit(values: CreateMessageType) {
    createMessageMutation.mutate({
      ...values,
      // The route scope can change while this form stays mounted; always send to the current one.
      scope,
      imageUrl: imageUrl ?? undefined,
    });
  }

  return (
    <form id="message-form">
      <FieldGroup>
        <Controller
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <MessageComposer
                key={editorKey}
                field={field}
                members={users}
                imageUrl={imageUrl}
                onImageChange={(url) => form.setValue("imageUrl", url)}
                onSubmit={form.handleSubmit(onSubmit)}
                isSubmitting={createMessageMutation.isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
