"use client";

import {
  type InfiniteData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { X } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  type ComponentProps,
  type CSSProperties,
  Suspense,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebarWithSide,
} from "@/components/ui/sidebar";
import { usePresence } from "@/hooks/use-presence";
import { type client, orpc } from "@/lib/orpc";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { RealtimeUserSchemaType } from "@/realtime/schema";
import { RenderJSONtoHTML } from "../editor/render-content";
import { UserImage } from "../general/user-avatar";
import {
  RealtimeThreadPRovider,
  useRealtimeThread,
} from "../realtime-thread-provider";
import { useRealtimeTeam } from "../team-realtime-provider";
import { SummarizeThreadPopover } from "./summarize-thread-popover";
import { ThreadActionsDropdown } from "./thread-actions-dropdown";
import { useThread } from "./thread-context";
import { ThreadsForm } from "./threads-form";

type ThreadsData = Awaited<ReturnType<typeof client.message.threads.list>>;
type MessageListPage = {
  messages: {
    id: string;
    _count: { replies: number };
  }[];
  nextCursor?: string;
};

// Empty state shown when no thread is selected or the thread has no replies yet.
function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground p-4 text-center">
      Select a message to view replies.
    </p>
  );
}

function ThreadItem({
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
                        _count: {
                          ...message._count,
                          replies: Math.max(0, message._count.replies - 1),
                        },
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
        <div className="flex items-start gap-2">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RightSidebar({
  width = "24rem",
  ...props
}: ComponentProps<typeof Sidebar> & { width?: string }) {
  const { threadId } = useThread();
  const { setOpen, isMobile, setOpenMobile } = useSidebarWithSide("right");
  const { organizationId } = useParams<{
    teamId: string;
    organizationId: string;
  }>();
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const threadsQueryOptions = orpc.message.threads.list.queryOptions({
    input: { threadId: threadId ?? "" },
  });

  const { data, isLoading } = useQuery({
    ...threadsQueryOptions,
    enabled: !!threadId,
  });

  const { data: organization } = useQuery(
    orpc.organization.list.queryOptions()
  );
  const selectedEditingThread = data
    ? (data.threads.find((thread) => thread.id === editingThreadId) ?? null)
    : null;

  const { data: organizationdata } = useQuery(
    orpc.organization.list.queryOptions()
  );

  const currentUser = organizationdata?.user
    ? ({ id: organizationdata.user.id } satisfies RealtimeUserSchemaType)
    : null;

  const { onlineusers } = usePresence({
    room: organizationId,
    user: currentUser,
  });

  const onlineUserIds = useMemo(
    () => new Set(onlineusers.map((user) => user.id)),
    [onlineusers]
  );

  if (!threadId) return null;

  return (
    <RealtimeThreadPRovider threadId={threadId}>
      <Sidebar
        {...props}
        style={{ "--sidebar-width": width } as CSSProperties}
        className="h-screen"
      >
        <SidebarHeader className="p-4 h-16 border-b">
          <SidebarRail />
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Replies</h1>
            <div className="flex items-center gap-2">
              <SummarizeThreadPopover threadId={threadId} />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  } else {
                    setOpen(false);
                  }
                }}
              >
                <X className="size-4" />
                <span className="sr-only">Close threads</span>
              </Button>
            </div>
          </div>
        </SidebarHeader>
        {/* Single scrollable area so parent message and replies scroll together */}
        <SidebarContent className="overflow-y-auto">
          <div className="flex flex-col gap-4 p-2">
            {threadId && isLoading && (
              <p className="text-sm text-muted-foreground p-4 text-center">
                Loading…
              </p>
            )}

            {threadId && data && (
              <>
                <Card>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <UserImage
                        image={data.parent.user.image}
                        // className="size-8 rounded-full object-cover object-center"
                        isOnline={
                          !!data.parent.user.id &&
                          onlineUserIds.has(data.parent.user.id)
                        }
                        showOnline={true}
                      />
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                          <p className="text-sm font-medium max-w-[12ch] truncate">
                            {data.parent.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(data.parent.createdAt)}
                          </p>
                        </div>
                        <RenderJSONtoHTML
                          content={JSON.parse(data.parent.content)}
                          className="text-sm wrap-break-word prose leading-relaxed dark:prose-invert max-w-[32ch] marker:text-primary"
                        />

                        {data.parent.imageUrl && (
                          <div>
                            <Image
                              src={data.parent.imageUrl}
                              alt="uploaded image"
                              width={512}
                              height={512}
                              className="object-cover rounded max-h-75 w-auto"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                <div className="text-sm text-muted-foreground">
                  {data.threads.length}{" "}
                  {data.threads.length === 1 ? "reply" : "replies"}
                </div>

                {data.threads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    threadId={threadId}
                    editingThreadId={editingThreadId}
                    setEditingThreadId={setEditingThreadId}
                    deletingThreadId={deletingThreadId}
                    setDeletingThreadId={setDeletingThreadId}
                    onlineUserIds={onlineUserIds}
                    organizationUserId={organization?.user.id}
                  />
                ))}
              </>
            )}
          </div>
        </SidebarContent>
        <SidebarFooter className="border-t px-2 shrink-0">
          {threadId ? (
            <Suspense fallback={null}>
              <ThreadsForm
                key={threadId}
                threadId={threadId}
                editingThread={selectedEditingThread}
                onCancelEdit={() => setEditingThreadId(null)}
              />
            </Suspense>
          ) : (
            <EmptyState />
          )}
        </SidebarFooter>
      </Sidebar>
    </RealtimeThreadPRovider>
  );
}
