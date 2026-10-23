"use client";
import { useQueryClient } from "@tanstack/react-query";
import usePartySocket from "partysocket/react";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
} from "react";
import type { MessageListItemType } from "@/app/(organization)/organizations/schema";
import {
  replaceReactionsInMessageList,
  replaceReactionsInThread,
} from "@/components/reaction/reactions";
import { authClient } from "@/lib/auth-client";
import {
  type ConversationScope,
  conversationKey,
  conversationRoomId,
} from "@/lib/conversation";
import { type client, orpc } from "@/lib/orpc";
import type { InfiniteMessages } from "@/lib/types";
import { groupReactions } from "@/lib/utils";
import {
  RealtimeConversationEventSchema,
  type RealtimeConversationEventSchemaType,
} from "@/realtime/schema";

interface ConversationRealtimeProviderProps {
  scope: ConversationScope;
  children: ReactNode;
}

// Partial key matching every cached threads.list query (any thread).
const threadListKey = orpc.message.threads.list.key({ type: "query" });
type ThreadQueryData = Awaited<ReturnType<typeof client.message.threads.list>>;

type RealtimeConversationContextValue = {
  send: (e: RealtimeConversationEventSchemaType) => void;
};

const RealtimeConversationContext =
  createContext<RealtimeConversationContextValue | null>(null);

export const ConversationRealtimeProvider = ({
  scope,
  children,
}: ConversationRealtimeProviderProps) => {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id ?? "";
  // Track the first open so a reconnect (not the initial connect) can recover
  // events that were missed while the socket was offline.
  const hasOpenedRef = useRef(false);

  const messageListKey = useMemo(() => conversationKey(scope), [scope]);
  const room = useMemo(() => conversationRoomId(scope), [scope]);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "http://localhost:8787",
    room,
    party: "chat",
    onOpen() {
      if (!hasOpenedRef.current) {
        hasOpenedRef.current = true;
        return;
      }
      queryClient.invalidateQueries({ queryKey: messageListKey });
      queryClient.invalidateQueries({ queryKey: threadListKey });
    },
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        const res = RealtimeConversationEventSchema.safeParse(data);
        if (res.error) {
          return;
        }
        const eventData = res.data;

        if (eventData.type === "message:created") {
          const raw = eventData.payload.message;
          const mapped: MessageListItemType = {
            id: raw.id,
            content: raw.content,
            imageUrl: raw.imageUrl ?? null,
            createdAt: raw.createdAt,
            repliesCount: raw.repliesCount ?? 0,
            reactions: [],
            user: raw.user,
          };

          queryClient.setQueryData<InfiniteMessages>(
            messageListKey,
            (oldMessages) => {
              if (!oldMessages)
                return {
                  pageParams: [undefined],
                  pages: [{ messages: [mapped], nextCursor: null }],
                } as InfiniteMessages;

              const first = oldMessages.pages[0];
              const updatedFirst = {
                ...first,
                messages: [mapped, ...first.messages],
              };
              return {
                ...oldMessages,
                pages: [updatedFirst, ...oldMessages.pages.slice(1)],
              };
            }
          );
        }

        if (eventData.type === "message:updated") {
          const updated = eventData.payload.message;
          // Patch only mutable fields so absent realtime values cannot wipe
          // repliesCount or reactions.
          const patch = {
            content: updated.content,
            imageUrl: updated.imageUrl ?? null,
            createdAt: updated.createdAt,
          };

          queryClient.setQueryData<InfiniteMessages>(messageListKey, (old) => {
            if (!old) return old;
            const pages = old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((message) =>
                message.id === updated.id ? { ...message, ...patch } : message
              ),
            }));
            return { ...old, pages };
          });
          return;
        }

        if (eventData.type === "message:reply:increment") {
          const { messageId, delta } = eventData.payload;

          queryClient.setQueryData<InfiniteMessages>(messageListKey, (old) => {
            if (!old) return old;
            const pages = old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((message) =>
                message.id === messageId
                  ? {
                      ...message,
                      repliesCount: Math.max(
                        0,
                        Number(message.repliesCount ?? 0) + Number(delta)
                      ),
                    }
                  : message
              ),
            }));

            return { ...old, pages };
          });
          return;
        }

        if (eventData.type === "message:deleted") {
          const { messageId } = eventData.payload;

          queryClient.setQueryData<InfiniteMessages>(messageListKey, (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                messages: page.messages.filter((msg) => msg.id !== messageId),
              })),
            };
          });
          return;
        }

        if (eventData.type === "reaction:updated") {
          const { messageId, reactions } = eventData.payload;

          // The server sends raw reactions; regroup them for THIS viewer before
          // writing, otherwise the actor's reactedByMe leaks into our cache.
          const grouped = groupReactions(reactions, currentUserId);

          // Replace only the reactions for the matching message in the list
          // cache; every other field stays untouched.
          queryClient.setQueryData<InfiniteMessages>(messageListKey, (old) =>
            replaceReactionsInMessageList(old, messageId, grouped)
          );

          // The same message also lives in the open thread's query
          // (parent + replies), so keep it in sync too.
          queryClient.setQueriesData<ThreadQueryData>(
            { queryKey: threadListKey },
            (old) => replaceReactionsInThread(old, messageId, grouped)
          );
          return;
        }
      } catch {
        // A dropped realtime frame must not spam the console.
      }
    },
  });

  const value = useMemo<RealtimeConversationContextValue>(
    () => ({
      send: (e) => socket.send(JSON.stringify(e)),
    }),
    [socket]
  );

  return (
    <RealtimeConversationContext.Provider value={value}>
      {children}
    </RealtimeConversationContext.Provider>
  );
};

export function useRealtimeConversation(): RealtimeConversationContextValue {
  const ctx = useContext(RealtimeConversationContext);
  if (!ctx)
    throw new Error(
      "useRealtimeConversation must be used within ConversationRealtimeProvider"
    );
  return ctx;
}
