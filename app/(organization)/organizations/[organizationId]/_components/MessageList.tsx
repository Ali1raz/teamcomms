"use client";

import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Ban, ChevronDownIcon, ChevronsDownIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresence } from "@/hooks/use-presence";
import { orpc } from "@/lib/orpc";
import type { RealtimeUserSchemaType } from "@/realtime/schema";
import { MessageItem } from "./message-item";

export function MessageList() {
  const { teamId } = useParams<{ teamId: string }>();
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [newMessages, setNewMessages] = useState<boolean>(false);
  const lastItemRef = useRef<string | undefined>(undefined);

  const infiniteOptions = orpc.message.list.infiniteOptions({
    input: (pageParams: string | undefined) => ({
      teamId,
      cursor: pageParams,
      limit: 30,
    }),
    queryKey: ["message.list", teamId],
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => ({
      pages: [...data.pages]
        .map((i) => ({
          ...i,
          messages: [...i.messages].reverse(),
        }))
        .reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
  } = useInfiniteQuery({
    ...infiniteOptions,
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const {
    data: { user },
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const isNearBottom = useCallback(
    (el: HTMLDivElement) =>
      el.scrollHeight - el.scrollTop - el.clientHeight <= 80,
    []
  );

  const handleScroll = () => {
    const el = ref.current;

    if (!el) return;

    if (el.scrollTop <= 80 && hasNextPage && !isFetching) {
      const prevScrollHeight = el.scrollHeight;
      const prevScrollTop = el.scrollTop;
      fetchNextPage().then(() => {
        console.log("===\nfetched next page", {
          hasNextPage,
          isFetchingNextPage,
        });
        // After loading new messages, adjust scroll to maintain position
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
      });
    }
    const atBottom = isNearBottom(el);
    setIsAtBottom(atBottom);
    // Clear the new-messages flag as soon as the user reaches the bottom,
    // so the button doesn't ghost-reappear on the next scroll tick.
    if (atBottom) setNewMessages(false);
  };

  const messages = useMemo(() => {
    return data?.pages.flatMap((page) => page.messages) ?? [];
  }, [data]);

  useEffect(() => {
    if (messages.length && !hasInitialScrolled) {
      const el = ref.current;
      if (el) {
        bottomRef.current?.scrollIntoView({ block: "end" });
        setHasInitialScrolled(true);
        setIsAtBottom(true);
      }
    }
  }, [messages.length, hasInitialScrolled]);

  // keep view pinned to bottom on late content load (images):
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const scrolltoBottomIfNeeded = () => {
      if (isAtBottom || !hasInitialScrolled) {
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ block: "end" });
        });
      }
    };

    const onImageLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        scrolltoBottomIfNeeded();
      }
    };

    el.addEventListener("load", onImageLoad, true);

    const resizeObserver = new ResizeObserver(() => {
      scrolltoBottomIfNeeded();
    });
    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(() => {
      scrolltoBottomIfNeeded();
    });
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      mutationObserver.disconnect();
      el.removeEventListener("load", onImageLoad, true);
      resizeObserver.disconnect();
    };
  }, [isAtBottom, hasInitialScrolled]);

  useEffect(() => {
    if (!messages.length) return;
    const lastId = messages[messages.length - 1].id;
    const prevItemId = lastItemRef.current;

    const el = ref.current;
    if (prevItemId && lastId !== prevItemId) {
      if (el && isNearBottom(el)) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });

        setNewMessages(false);
        setIsAtBottom(true);
      } else {
        setNewMessages(true);
      }
    }
    lastItemRef.current = lastId;
  }, [messages, isNearBottom]);

  const scrollToBottom = () => {
    const el = ref.current;

    if (el) {
      bottomRef.current?.scrollIntoView({ block: "end" });
      setNewMessages(false);
      setIsAtBottom(true);
    }
  };

  const { organizationId } = useParams<{ organizationId: string }>();
  const currentUser = user
    ? ({ id: user.id } satisfies RealtimeUserSchemaType)
    : null;

  const { onlineusers } = usePresence({
    room: organizationId,
    user: currentUser,
  });

  const onlineUserIds = useMemo(
    () => new Set(onlineusers.map((u) => u.id)),
    [onlineusers]
  );

  if ((!messages || messages?.length === 0) && !isFetching) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Empty className="h-full bg-muted/40">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="bg-muted rounded-full size-28"
            >
              <Ban className="sm:size-14 size-8" />
            </EmptyMedia>
            <EmptyTitle className="sm:text-4xl sm:mt-6 mt-4 text-2xl">
              No messages
            </EmptyTitle>
            <EmptyDescription className="sm:w-xl w-sm sm:text-lg text-xs">
              There are no messages in this team yet. Start the conversation by
              sending a new message!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full h-full">
        {[...Array(10)].map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="flex px-4 items-start gap-2 w-full"
          >
            <Skeleton className="rounded-full size-10" />
            <div className="flex flex-col gap-2 w-full">
              <div className="flex mb-4 items-center gap-4">
                <Skeleton className="w-28 h-4" />
                <Skeleton className="w-34 h-4" />
              </div>
              <Skeleton className="w-5/6 h-4" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-4/5 h-4" />
              <Skeleton className="w-4/5 h-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-2 space-y-1"
      >
        {messages?.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            currentUserId={user.id}
            onlineUserIds={onlineUserIds}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 absolute bottom-4 right-4 z-20">
        {!isAtBottom && (
          <Button
            type="button"
            size="sm"
            className="size-8 rounded-full hover:shadow-xl transition-all duration-100"
            onClick={scrollToBottom}
          >
            <ChevronDownIcon className="size-4" />
          </Button>
        )}

        {newMessages && !isAtBottom && (
          <Button
            type="button"
            onClick={scrollToBottom}
            className="rounded-full shadow-md"
          >
            <ChevronsDownIcon className="size-4" /> New messages
          </Button>
        )}
      </div>
    </div>
  );
}
