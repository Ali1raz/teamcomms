"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs/server";
import {
  type ComponentProps,
  type CSSProperties,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ImageZoom } from "@/components/kibo-ui/image-zoom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebarWithSide,
} from "@/components/ui/sidebar";
import { useConversationScope } from "@/hooks/use-conversation-scope";
import { usePresence } from "@/hooks/use-presence";
import { conversationRoomId } from "@/lib/conversation";
import { orpc } from "@/lib/orpc";
import { formatRelativeTime } from "@/lib/utils";
import type { RealtimeUserSchemaType } from "@/realtime/schema";
import { RenderJSONtoHTML } from "../editor/render-content";
import { ExpandableContent } from "../general/expandable-content";
import { UserImage } from "../general/user-avatar";
import { ReactionBar } from "../reaction/reaction-bar";
import { RealtimeThreadPRovider } from "../realtime-thread-provider";
import { Marker, MarkerContent } from "../ui/marker";
import { SummarizeThreadPopover } from "./summarize-thread-popover";
import { useThread } from "./thread-context";
import { ThreadItem } from "./thread-item";
import { ThreadsForm } from "./threads-form";

// Empty state shown when no thread is selected or the thread has no replies yet.
function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground p-4 text-center">
      Select a message to view replies.
    </p>
  );
}

export function RightSidebar({
  width = "24rem",
  ...props
}: ComponentProps<typeof Sidebar> & { width?: string }) {
  const { threadId: contextThreadId, setThreadId } = useThread();
  const { open, setOpen, isMobile, setOpenMobile } =
    useSidebarWithSide("right");
  const { organizationId } = useParams<{ organizationId: string }>();
  const scope = useConversationScope();
  const roomId = scope ? conversationRoomId(scope) : null;
  const prevRoomIdRef = useRef(roomId);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  // Read threadId (the reply) and messageId (the parent message) from URL so a
  // mention email link can auto-open the threads sidebar on desktop/mobile.
  const [urlThreadId] = useQueryState(
    "threadId",
    parseAsString.withDefault("")
  );
  const [urlMessageId] = useQueryState(
    "messageId",
    parseAsString.withDefault("")
  );

  const effectiveThreadId = urlMessageId || contextThreadId;

  // Sync a URL-driven threadId into the shared context so MessageItem and
  // the rest of the tree see the active thread.
  useEffect(() => {
    if (urlThreadId && contextThreadId !== urlThreadId) {
      setThreadId(urlThreadId);
    }
  }, [urlThreadId, contextThreadId, setThreadId]);

  // Auto-open the threads sidebar when a thread reply (threadId) and its
  // parent message (messageId) arrive from the URL (e.g. a mention email link).
  useEffect(() => {
    if (urlMessageId && effectiveThreadId && !open) {
      if (isMobile) {
        setOpenMobile(true);
      } else {
        setOpen(true);
      }
    }
  }, [urlMessageId, effectiveThreadId, open, isMobile, setOpen, setOpenMobile]);

  // Close the sidebar and clear thread context when the URL filters are
  // cleared (e.g. via the Clear Message Filter button in MessageList).
  //
  // `setOpen` changes identity whenever the right sidebar's open state changes
  // (SidebarProvider derives it from openRight). Subscribing to it here would
  // make this effect re-run every time the sidebar opens and immediately close
  // it again when no URL params are present. Only react to URL filter changes
  // and call the setters through refs so they stay current without re-subscribing.
  const setOpenRef = useRef(setOpen);
  const setOpenMobileRef = useRef(setOpenMobile);
  const setThreadIdRef = useRef(setThreadId);
  setOpenRef.current = setOpen;
  setOpenMobileRef.current = setOpenMobile;
  setThreadIdRef.current = setThreadId;

  useEffect(() => {
    if (!urlMessageId && !urlThreadId) {
      setThreadIdRef.current(null);
      if (isMobile) {
        setOpenMobileRef.current(false);
      } else {
        setOpenRef.current(false);
      }
    }
  }, [urlMessageId, urlThreadId, isMobile]);

  useEffect(() => {
    if (prevRoomIdRef.current === roomId) return;
    prevRoomIdRef.current = roomId;
    setThreadId(null);
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  }, [roomId, isMobile, setThreadId, setOpen, setOpenMobile]);

  const threadsQueryOptions = orpc.message.threads.list.queryOptions({
    input: { threadId: effectiveThreadId ?? "" },
  });

  const { data, isLoading } = useQuery({
    ...threadsQueryOptions,
    enabled: !!effectiveThreadId,
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

  if (!effectiveThreadId || !scope) return null;

  return (
    <RealtimeThreadPRovider threadId={effectiveThreadId}>
      <Sidebar
        {...props}
        style={{ "--sidebar-width": width } as CSSProperties}
        className="h-dvh"
      >
        <SidebarHeader className="p-4 h-16 border-b">
          <SidebarRail />
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Replies</h1>
            <div className="flex items-center gap-2">
              <SummarizeThreadPopover threadId={effectiveThreadId} />
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
          {effectiveThreadId && isLoading && (
            <p className="text-sm text-muted-foreground p-4 text-center">
              Loading…
            </p>
          )}

          {effectiveThreadId && data && (
            <div>
              <div className="flex items-start gap-2 p-3">
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
                  <ExpandableContent>
                    <RenderJSONtoHTML
                      content={JSON.parse(data.parent.content)}
                      className="text-sm wrap-break-word prose leading-relaxed dark:prose-invert max-w-[32ch] marker:text-primary"
                    />
                  </ExpandableContent>

                  {data.parent.imageUrl && (
                    <ImageZoom>
                      <Image
                        src={data.parent.imageUrl}
                        alt="uploaded image"
                        width={512}
                        height={512}
                        className="object-cover rounded max-h-75 w-auto"
                      />
                    </ImageZoom>
                  )}

                  <div className="flex flex-col gap-2">
                    <ReactionBar
                      messageId={data.parent.id}
                      reactions={data.parent.reactions}
                    />
                  </div>
                </div>
              </div>

              <Marker variant="separator">
                <MarkerContent className="text-sm text-muted-foreground px-3">
                  {data.threads.length}{" "}
                  {data.threads.length === 1 ? "reply" : "replies"}
                </MarkerContent>
              </Marker>

              <div>
                {data.threads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    scope={scope}
                    thread={thread}
                    threadId={effectiveThreadId}
                    editingThreadId={editingThreadId}
                    setEditingThreadId={setEditingThreadId}
                    deletingThreadId={deletingThreadId}
                    setDeletingThreadId={setDeletingThreadId}
                    onlineUserIds={onlineUserIds}
                    organizationUserId={organization?.user.id}
                  />
                ))}
              </div>
            </div>
          )}
        </SidebarContent>
        <SidebarFooter className="border-t px-2 shrink-0">
          {effectiveThreadId ? (
            <Suspense fallback={null}>
              <ThreadsForm
                key={effectiveThreadId}
                scope={scope}
                threadId={effectiveThreadId}
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
