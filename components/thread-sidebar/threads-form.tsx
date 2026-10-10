"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { InfiniteMessages } from "@/app/(organization)/organizations/[organizationId]/_components/message-item";
import { Messagecomponser } from "@/app/(organization)/organizations/[organizationId]/_components/message-omposer";
import {
  type CreateMessageType,
  createMessageSchema,
} from "@/app/(organization)/organizations/schema";
import { type client, orpc } from "@/lib/orpc";
import { useRealtimeThread } from "../realtime-thread-provider";
import { useRealtimeTeam } from "../team-realtime-provider";
import { Button } from "../ui/button";
import { Field, FieldError, FieldGroup } from "../ui/field";

type ThreadsData = Awaited<ReturnType<typeof client.message.threads.list>>;
type ThreadItem = ThreadsData["threads"][number];

interface ThreadsFormProps {
  threadId: string;
  editingThread: ThreadItem | null;
  onCancelEdit: () => void;
}

export function ThreadsForm({
  threadId,
  editingThread,
  onCancelEdit,
}: ThreadsFormProps) {
  const [composerVersion, setComposerVersion] = useState(0);
  const { teamId } = useParams<{
    teamId: string;
    organizationId: string;
  }>();
  const queryClient = useQueryClient();

  const { send } = useRealtimeTeam();

  const { send: sendThread } = useRealtimeThread();

  const threadsQueryOptions = orpc.message.threads.list.queryOptions({
    input: { threadId },
  });

  const messageListKey = ["message.list", teamId];

  const {
    data: { user: currentUser },
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const form = useForm<CreateMessageType>({
    resolver: zodResolver(createMessageSchema),
    defaultValues: {
      content: editingThread?.content ?? "",
      teamId,
      imageUrl: editingThread?.imageUrl ?? undefined,
      threadId,
    },
    mode: "onChange",
  });

  const composerKey = editingThread
    ? `edit-${editingThread.id}`
    : `create-${composerVersion}`;

  useEffect(() => {
    form.reset({
      content: editingThread?.content ?? "",
      teamId,
      imageUrl: editingThread?.imageUrl ?? undefined,
      threadId,
    });
    // Keep the composer inputs synced with whichever reply is currently focused.
  }, [editingThread, teamId, threadId, form]);

  const createThreadMutation = useMutation(
    orpc.message.create.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: threadsQueryOptions.queryKey,
        });
        await queryClient.cancelQueries({ queryKey: messageListKey });

        const prevData = queryClient.getQueryData<ThreadsData>(
          threadsQueryOptions.queryKey
        );
        const prevMessageListData =
          queryClient.getQueryData<InfiniteMessages>(messageListKey);

        // Build a temporary reply that matches ThreadItem exactly so it renders
        // immediately without waiting for the server round-trip.
        const optimisticThread: ThreadItem = {
          id: `optimistic-${crypto.randomUUID()}`,
          content: variables.content,
          imageUrl: variables.imageUrl ?? null,
          createdAt: new Date(),
          repliesCount: 0,
          reactions: [],
          // Reuse the real session user so the optimistic reply matches the current author.
          user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            image:
              currentUser.image ??
              `https://avatar.vercel.sh/${currentUser.name ?? "U"}`,
          },
        };

        // Append the optimistic reply at the end — server orders threads by
        // createdAt ASC so newest always goes last.
        if (prevData) {
          queryClient.setQueryData<ThreadsData>(threadsQueryOptions.queryKey, {
            ...prevData,
            threads: [...prevData.threads, optimisticThread],
          });
        }

        // Optimistically increment the reply count on the parent message so the
        // message list shows the updated count immediately without a refetch.
        if (prevMessageListData) {
          queryClient.setQueryData<InfiniteMessages>(messageListKey, {
            ...prevMessageListData,
            pages: prevMessageListData.pages.map((page) => ({
              ...page,
              messages: page.messages.map((message) =>
                message.id === threadId
                  ? {
                      ...message,
                      repliesCount: message.repliesCount + 1,
                    }
                  : message
              ),
            })),
          });
        }

        // Return both snapshots so onError can restore them.
        return { prevData, prevMessageListData };
      },
      onSuccess: (data) => {
        form.reset({
          content: "",
          teamId,
          imageUrl: undefined,
          threadId,
        });
        setComposerVersion((prev) => prev + 1);
        queryClient.invalidateQueries({
          queryKey: threadsQueryOptions.queryKey,
        });
        queryClient.invalidateQueries({ queryKey: messageListKey });

        sendThread({
          type: "reply:created",
          payload: {
            reply: {
              ...data,
              user: {
                id: currentUser.id,
                name: currentUser.name,
                image: currentUser.image ?? null,
                email: currentUser.email,
              },
            },
          },
        });

        send({
          type: "message:reply:increment",
          payload: { messageId: threadId, delta: 1 },
        });
        toast.success("Reply sent successfully");
      },
      onError: (error, _variables, context) => {
        // Roll back the thread list to its pre-optimistic snapshot.
        if (context?.prevData) {
          queryClient.setQueryData(
            threadsQueryOptions.queryKey,
            context.prevData
          );
        }
        // Roll back the optimistic reply count increment in the message list.
        if (context?.prevMessageListData) {
          queryClient.setQueryData(messageListKey, context.prevMessageListData);
        }
        toast.error("Something bad happened, please try again!", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  const updateThreadMutation = useMutation(
    orpc.message.update.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: threadsQueryOptions.queryKey,
        });

        const prevData = queryClient.getQueryData<ThreadsData>(
          threadsQueryOptions.queryKey
        );

        // Keep the reply list in place and just swap the edited content/image in the cache.
        queryClient.setQueryData<ThreadsData>(
          threadsQueryOptions.queryKey,
          (old) => {
            if (!old) return old;
            return {
              ...old,
              threads: old.threads.map((thread) =>
                thread.id === variables.messageId
                  ? {
                      ...thread,
                      content: variables.content,
                      imageUrl:
                        variables.imageUrl === undefined
                          ? thread.imageUrl
                          : variables.imageUrl,
                    }
                  : thread
              ),
            };
          }
        );

        return { prevData };
      },
      onSuccess: (data) => {
        sendThread({
          type: "reply:updated",
          payload: {
            reply: {
              id: data.message.id,
              content: data.message.content,
              imageUrl: data.message.imageUrl,
              createdAt: data.message.createdAt,
              user: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                image: currentUser.image ?? null,
              },
            },
          },
        });

        toast.success("Reply updated successfully");
        onCancelEdit();
        form.reset({
          content: "",
          teamId,
          imageUrl: undefined,
          threadId,
        });
        queryClient.invalidateQueries({
          queryKey: threadsQueryOptions.queryKey,
        });
      },
      onError: (error, _variables, context) => {
        if (context?.prevData) {
          queryClient.setQueryData(
            threadsQueryOptions.queryKey,
            context.prevData
          );
        }
        toast.error("Failed to update reply", {
          description: error.message || null,
        });
      },
    })
  );

  function onSubmit(values: CreateMessageType) {
    if (editingThread) {
      updateThreadMutation.mutate({
        messageId: editingThread.id,
        content: values.content,
        imageUrl: values.imageUrl ?? null,
      });
      return;
    }

    createThreadMutation.mutate({
      ...values,
      imageUrl: values.imageUrl ?? undefined,
    });
  }

  const isSubmitting = editingThread
    ? updateThreadMutation.isPending
    : createThreadMutation.isPending;

  return (
    <form id="thread-form">
      <FieldGroup>
        {editingThread && (
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span>Editing reply</span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                onCancelEdit();
                form.reset({
                  content: "",
                  teamId,
                  imageUrl: undefined,
                  threadId,
                });
              }}
            >
              Cancel edit
            </Button>
          </div>
        )}

        <Controller
          control={form.control}
          name="imageUrl"
          render={({ field: imageField }) => (
            <Controller
              control={form.control}
              name="content"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Messagecomponser
                    key={composerKey}
                    field={field}
                    imageUrl={imageField.value}
                    onImageChange={(url) => imageField.onChange(url)}
                    onClearImage={() => imageField.onChange(null)}
                    onSubmit={form.handleSubmit(onSubmit)}
                    isSubmitting={isSubmitting}
                    submitLabel={editingThread ? "Update" : "Send"}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}
        />
      </FieldGroup>
    </form>
  );
}
