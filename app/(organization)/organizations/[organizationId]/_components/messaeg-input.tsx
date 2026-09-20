/* eslint-disable react-hooks/incompatible-library */
"use client";

import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { createMessageSchema, CreateMessageType } from "../../schema";
import { Messagecomponser } from "./message-omposer";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { client } from "@/lib/orpc";
import { orpc } from "@/lib/orpc";
import { toast } from "sonner";
import { useState } from "react";
import { useRealtimeTeam } from "@/components/team-realtime-provider";

// ---------------------------------------------------------------------------
// Types inferred directly from the oRPC client so they stay in sync with the
// server schema without any manual duplication.
// ---------------------------------------------------------------------------

/** Shape of a single page returned by the message.list procedure. */
type MessagePage = Awaited<ReturnType<typeof client.message.list>>;

/** Shape of a single message item inside a page. */
type MessageItem = MessagePage["messages"][number];

interface IAppPops {
  teamId: string;
}

export function MessageInput({ teamId }: IAppPops) {
  const [editorKey, setEditorKey] = useState(0);

  const { send } = useRealtimeTeam();

  const form = useForm<CreateMessageType>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      content: "",
      teamId: teamId,
      imageUrl: undefined,
    },
    mode: "onChange",
  });

  const imageUrl = form.watch("imageUrl");

  const queryclient = useQueryClient();

  // Use organization.list (already prefetched in the layout) instead of team.get
  // to avoid a duplicate network request just for the current user's info.
  const {
    data: { user: currentUser },
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const { data: membersData } = useSuspenseQuery(
    orpc.team.members.list.queryOptions({ input: { teamId } })
  );

  const members = membersData.members
    .filter((member) => member.id !== currentUser.id)
    .map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      image: member.image ?? undefined,
    }));

  const createMessageMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (variables) => {
        // Stop any outgoing refetches so they don't overwrite the optimistic update.
        await queryclient.cancelQueries({
          queryKey: ["message.list", teamId],
        });

        // Snapshot the current cache so we can roll back on error.
        const prevData = queryclient.getQueryData<
          InfiniteData<MessagePage, string | undefined>
        >(["message.list", teamId]);

        // Build a fake message that matches MessageItem exactly so the UI
        // renders it immediately without waiting for the server round-trip.
        const tempId = `optimistic-${crypto.randomUUID()}`;
        const optimisticMessage: MessageItem = {
          id: tempId,
          content: variables.content,
          imageUrl: variables.imageUrl ?? null,
          createdAt: new Date(),
          // New messages have no replies yet; required by MessageItem's _count shape.
          _count: { replies: 0 },
          // Use the real session user so the avatar / name look correct.
          user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            image:
              currentUser.image ??
              `https://avatar.vercel.sh/${currentUser.name ?? "U"}`,
          },
        };

        // Inject the optimistic message at the front of the first page.
        // The raw cache stores pages newest-first (orderBy: createdAt DESC),
        // so index-0 is the most-recent page — exactly where the new message belongs.
        if (prevData) {
          queryclient.setQueryData<
            InfiniteData<MessagePage, string | undefined>
          >(["message.list", teamId], {
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
          queryclient.setQueryData<
            InfiniteData<MessagePage, string | undefined>
          >(["message.list", teamId], (old) => {
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
        form.reset({ teamId, content: "", imageUrl: undefined });
        form.setValue("imageUrl", undefined);

        // Invalidate using the same raw key the infinite query is stored under
        // (not the oRPC-generated key, which differs from what MessageList uses).
        queryclient.invalidateQueries({
          queryKey: ["message.list", teamId],
        });

        send({
          type: "message:created",
          payload: {
            message: {
              ...createdMessage,
              user: {
                id: currentUser.id,
                name: currentUser.name,
                image: currentUser.image ?? null,
                email: currentUser.email,
              },
              _count: { replies: 0 },
            },
          },
        });

        toast.success("Message sent successfully");
      },
      onError: (error, _variables, context) => {
        // Roll back to the pre-optimistic snapshot if we have one.
        if (context?.prevData) {
          queryclient.setQueryData(["message.list", teamId], context.prevData);
        }
        toast.error("Something bad happened, please try again!", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  function onSubmit(values: CreateMessageType) {
    createMessageMutation.mutate({
      ...values,
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
              <Messagecomponser
                key={editorKey}
                field={field}
                members={members}
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
