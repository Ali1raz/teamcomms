"use client";

import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardAction, CardContent } from "@/components/ui/card";
import { type client, orpc } from "@/lib/orpc";
import { cn, formatRelativeTime } from "@/lib/utils";
import { RenderJSONtoHTML } from "../editor/render-content";
import { UserImage } from "../general/user-avatar";
import { ReactionBar } from "../reaction/reaction-bar";
import { useRealtimeThread } from "../realtime-thread-provider";
import { useRealtimeTeam } from "../team-realtime-provider";
import { ThreadActionsDropdown } from "./thread-actions-dropdown";

type ThreadsData = Awaited<ReturnType<typeof client.message.threads.list>>;
type MessageListPage = {
  messages: {
    id: string;
    repliesCount: number;
  }[];
  nextCursor?: string;
};

export function ThreadItem({
  thread,
  threadId,
  editingThreadId,
  setEditingThreadId,
  deletingThreadId,
  setDeletingThreadId,
  onlineUserIds,
  organizationUserId,
}: {
  thread: ThreadsData["threads"][number];
  threadId: string;
  editingThreadId: string | null;
  setEditingThreadId: (id: string | null) => void;
  deletingThreadId: string | null;
  setDeletingThreadId: (id: string | null) => void;
  onlineUserIds: Set<string>;
  organizationUserId: string | undefined;
}) {
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
          queryClient.getQueryData<InfiniteData<MessageListPage>>(
            messageListKey
          );

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

        queryClient.setQueryData<InfiniteData<MessageListPage>>(
          messageListKey,
          (old) => {
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
          }
        );

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
    <Card
      key={thread.id}
      className={cn(
        editingThreadId === thread.id && "ring-1 ring-primary bg-muted/40"
      )}
    >
      <CardContent className="relative">
        <CardAction className="absolute -top-2 right-2">
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
        </CardAction>
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
            <RenderJSONtoHTML
              content={JSON.parse(thread.content)}
              className="text-sm wrap-break-word prose dark:prose-invert leading-relaxed w-full marker:text-primary"
            />

            {thread.imageUrl && (
              <div>
                <Image
                  src={thread.imageUrl}
                  alt="uploaded image"
                  width={512}
                  height={512}
                  className="object-cover rounded max-h-75 w-auto"
                />
              </div>
            )}

            <ReactionBar messageId={thread.id} reactions={thread.reactions} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
