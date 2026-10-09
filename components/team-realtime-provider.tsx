"use client";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import usePartySocket from "partysocket/react";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import {
  type RealtimeMessageSchemaType,
  RealtimeTeamEventSchema,
  type RealtimeTeamEventSchemaType,
} from "@/realtime/schema";

interface RealtimeTeamContextProps {
  teamId: string;
  children: ReactNode;
}

type MessageListPage = {
  messages: RealtimeMessageSchemaType[];
  nextCursor?: string;
};
type InfiniteMessages = InfiniteData<MessageListPage>;

type RealtimeTeamContextValue = {
  send: (e: RealtimeTeamEventSchemaType) => void;
};

const RealtimeTeamContext = createContext<RealtimeTeamContextValue | null>(
  null
);

export const RealtimeTeamProvider = ({
  teamId,
  children,
}: RealtimeTeamContextProps) => {
  const queryClient = useQueryClient();

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "http://localhost:8787",
    room: teamId,
    party: "chat",
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        const res = RealtimeTeamEventSchema.safeParse(data);
        if (res.error) {
          console.log("Failed to parse message:", res.error);
          return;
        }
        const eventData = res.data;

        if (eventData.type === "message:created") {
          const raw = eventData.payload.message;
          const mapped = {
            ...raw,
            _count: { replies: raw._count?.replies ?? 0 },
          };

          queryClient.setQueryData<InfiniteMessages>(
            ["message.list", teamId],
            (oldMessages) => {
              if (!oldMessages)
                return {
                  pageParams: [undefined],
                  pages: [{ messages: [mapped], nextCursor: undefined }],
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
          // replace message in infinite list
          queryClient.setQueryData<InfiniteMessages>(
            ["message.list", teamId],
            (old) => {
              if (!old) return old;
              const pages = old.pages.map((page) => ({
                ...page,
                messages: page.messages.map((message) =>
                  message.id === updated.id
                    ? { ...message, ...updated }
                    : message
                ),
              }));
              return { ...old, pages };
            }
          );
          return;
        }

        if (eventData.type === "message:reply:increment") {
          const { messageId, delta } = eventData.payload;

          queryClient.setQueryData<InfiniteMessages>(
            ["message.list", teamId],
            (old) => {
              if (!old) return old;
              const pages = old.pages.map((page) => ({
                ...page,
                messages: page.messages.map((message) =>
                  message.id === messageId
                    ? {
                        ...message,
                        _count: {
                          replies: Math.max(
                            0,
                            Number(message._count?.replies ?? 0) + Number(delta)
                          ),
                        },
                      }
                    : message
                ),
              }));

              return { ...old, pages };
            }
          );
          return;
        }

        if (eventData.type === "message:deleted") {
          const { messageId } = eventData.payload;

          queryClient.setQueryData<InfiniteMessages>(
            ["message.list", teamId],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  messages: page.messages.filter((msg) => msg.id !== messageId),
                })),
              };
            }
          );
          return;
        }
      } catch {
        console.log("[RealtimeTeamProvider]: Something went wrong");
      }
    },
  });

  const value = useMemo<RealtimeTeamContextValue>(
    () => ({
      send: (e) => socket.send(JSON.stringify(e)),
    }),
    [socket]
  );

  return (
    <RealtimeTeamContext.Provider value={value}>
      {children}
    </RealtimeTeamContext.Provider>
  );
};

export function useRealtimeTeam(): RealtimeTeamContextValue {
  const ctx = useContext(RealtimeTeamContext);
  if (!ctx)
    throw new Error("useRealtimeTeam must be used within RealtimeTeamProvider");
  return ctx;
}
