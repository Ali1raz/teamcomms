"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { toast } from "sonner";
import { ImageZoom } from "@/components/kibo-ui/image-zoom";
import type { ConversationScope } from "@/lib/conversation";
import { conversationKey } from "@/lib/conversation";
import { type client, orpc } from "@/lib/orpc";
import type { InfiniteMessages } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useRealtimeConversation } from "../conversation-realtime-provider";
import { RenderJSONtoHTML } from "../editor/render-content";
import { ExpandableContent } from "../general/expandable-content";
import { UserImage } from "../general/user-avatar";
import { ReactionBar } from "../reaction/reaction-bar";
import { useRealtimeThread } from "../realtime-thread-provider";
import { ThreadActionsDropdown } from "./thread-actions-dropdown";

type ThreadsData = Awaited<ReturnType<typeof client.message.threads.list>>;

export function ThreadItem({
  scope,
  thread,
  threadId,
  editingThreadId,
  setEditingThreadId,
  deletingThreadId,
  setDeletingThreadId,
  onlineUserIds,
  organizationUserId,
}: {
  scope: ConversationScope;
  thread: ThreadsData["threads"][number];
  threadId: string;
  editingThreadId: string | null;
  setEditingThreadId: (id: string | null) => void;
  deletingThreadId: string | null;
  setDeletingThreadId: (id: string | null) => void;
  onlineUserIds: Set<string>;
  organizationUserId: string | undefined;
}) {
  const queryClient = useQueryClient();
  const { send } = useRealtimeConversation();
  const { send: sendThread } = useRealtimeThread();

  const threadsQueryOptions = orpc.message.threads.list.queryOptions({
    input: { threadId },
  });

  const messageListKey = conversationKey(scope);

  const deleteThreadMutation = useMutation(
    orpc.message.delete.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: threadsQueryOptions.queryKey,
        });
        await queryClient.cancelQueries({ queryKey: messageListKey });

        const prevThreadData = queryClient.getQueryData<ThreadsData>(
          threadsQueryOptions.queryKey
        );
        const prevMessageListData =
          queryClient.getQueryData<InfiniteMessages>(messageListKey);

        queryClient.setQueryData<ThreadsData>(
          threadsQueryOptions.queryKey,
          (old) => {
            if (!old) return old;
            return {
              ...old,
              threads: old.threads.filter(
                (thread) => thread.id !== variables.messageId
              ),
            };
          }
        );

        queryClient.setQueryData<InfiniteMessages>(messageListKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((message) =>
                message.id === threadId
                  ? {
                      ...message,
                      repliesCount: Math.max(0, message.repliesCount - 1),
                    }
                  : message
              ),
            })),
          };
        });

        return { prevThreadData, prevMessageListData };
      },
      onSuccess: (_data, variables) => {
        sendThread({
          type: "reply:deleted",
          payload: { replyId: variables.messageId },
        });
        send({
          type: "message:reply:increment",
          payload: { messageId: threadId, delta: -1 },
        });
        toast.success("Reply deleted successfully!");
        setEditingThreadId(null);
      },
      onError: (error, _variables, context) => {
        if (context?.prevThreadData) {
          queryClient.setQueryData(
            threadsQueryOptions.queryKey,
            context.prevThreadData
          );
        }
        if (context?.prevMessageListData) {
          queryClient.setQueryData(messageListKey, context.prevMessageListData);
        }
        toast.error("Failed to delete reply", {
          description: error.message,
        });
      },
      onSettled: () => {
        setDeletingThreadId(null);
        queryClient.invalidateQueries({
          queryKey: threadsQueryOptions.queryKey,
        });
        queryClient.invalidateQueries({ queryKey: messageListKey });
      },
    })
  );

  return (
    <div
      key={thread.id}
      className={cn(
        "first:mt-2 hover:bg-muted/30 p-3 not-last:border-b",
        editingThreadId === thread.id && "ring-1 ring-primary bg-muted/40",
        thread.id === threadId && "bg-muted/50",
        thread.mentionedUserIds?.includes(organizationUserId ?? "") &&
          "border-l-primary border-l-3"
      )}
    >
      <div className="relative">
        <div className="absolute top-0 right-2">
          <ThreadActionsDropdown
            canEdit={organizationUserId === thread.user.id}
            isDeleting={deletingThreadId === thread.id}
            onEdit={() => setEditingThreadId(thread.id)}
            onDelete={async () => {
              setDeletingThreadId(thread.id);
              await deleteThreadMutation.mutateAsync({
                messageId: thread.id,
              });
            }}
          />
        </div>
        <div className="flex gap-2 items-start">
          <UserImage
            image={thread.user.image}
            name={thread.user.name}
            className="size-8 rounded-full object-cover object-center"
            isOnline={!!thread.user.id && onlineUserIds.has(thread.user.id)}
            showOnline={true}
          />
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <p className="text-sm font-medium max-w-[12ch] truncate">
                {thread.user.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(thread.createdAt)}
              </p>
            </div>
            <ExpandableContent>
              <RenderJSONtoHTML
                content={JSON.parse(thread.content)}
                className="text-sm wrap-break-word prose dark:prose-invert leading-relaxed w-full marker:text-primary"
              />
            </ExpandableContent>

            {thread.imageUrl && (
              <ImageZoom>
                <Image
                  src={thread.imageUrl}
                  alt="uploaded image"
                  width={512}
                  height={512}
                  className="object-cover rounded max-h-75 w-auto"
                />
              </ImageZoom>
            )}

            <ReactionBar messageId={thread.id} reactions={thread.reactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
