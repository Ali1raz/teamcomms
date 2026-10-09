"use client";

import { useQueryClient } from "@tanstack/react-query";
import usePartySocket from "partysocket/react";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { orpc } from "@/lib/orpc";
import {
  RealtimeReplyEventSchema,
  type RealtimeReplyEventSchemaType,
} from "@/realtime/schema";

type RealtimeReplycontextValue = {
  send: (event: RealtimeReplyEventSchemaType) => void;
};
const RealtimeThreadContext = createContext<RealtimeReplycontextValue | null>(
  null
);

interface RealtimethreadPRoviderProps {
  children: ReactNode;
  threadId: string;
}

type ThreadListOptions = ReturnType<
  typeof orpc.message.threads.list.queryOptions
>;

type ThreadQuerydata = Awaited<ReturnType<ThreadListOptions["queryFn"]>>;

export function RealtimeThreadPRovider({
  children,
  threadId,
}: RealtimethreadPRoviderProps) {
  const queryClient = useQueryClient();

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "http://localhost:8787",
    room: threadId,
    party: "chat",
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        const res = RealtimeReplyEventSchema.safeParse(data);
        if (!res.success) {
          console.log("invalid event", data);
          return;
        }

        const e = res.data;

        if (e.type === "reply:created") {
          const replyObj = e.payload.reply;
          const listOptions = orpc.message.threads.list.queryOptions({
            input: { threadId },
          });

          queryClient.setQueryData<ThreadQuerydata>(
            listOptions.queryKey,
            (old) => {
              if (!old) return old;

              const reply = {
                ...replyObj,
              } as ThreadQuerydata["threads"][number];

              return {
                ...old,
                threads: [...old.threads, reply],
              };
            }
          );

          return;
        }

        if (e.type === "reply:updated") {
          const updatedReply = e.payload.reply;
          const listOptions = orpc.message.threads.list.queryOptions({
            input: { threadId },
          });

          queryClient.setQueryData<ThreadQuerydata>(
            listOptions.queryKey,
            (old) => {
              if (!old) return old;
              return {
                ...old,
                threads: old.threads.map((thread) =>
                  thread.id === updatedReply.id
                    ? { ...thread, ...updatedReply }
                    : thread
                ),
              };
            }
          );

          return;
        }

        if (e.type === "reply:deleted") {
          const { replyId } = e.payload;
          const listOptions = orpc.message.threads.list.queryOptions({
            input: { threadId },
          });

          queryClient.setQueryData<ThreadQuerydata>(
            listOptions.queryKey,
            (old) => {
              if (!old) return old;
              return {
                ...old,
                threads: old.threads.filter((thread) => thread.id !== replyId),
              };
            }
          );

          return;
        }
      } catch (e) {
        console.error(e);
      }
    },
  });

  const value = useMemo<RealtimeReplycontextValue>(() => {
    return {
      send: (event) => {
        socket.send(JSON.stringify(event));
      },
    };
  }, [socket]);

  return (
    <RealtimeThreadContext.Provider value={value}>
      {children}
    </RealtimeThreadContext.Provider>
  );
}

export function useRealtimeThread() {
  const context = useContext(RealtimeThreadContext);

  if (!context) {
    throw new Error(
      "useRealtimeThread must be used within a RealtimeThreadProvider"
    );
  }

  return context;
}
