import usePartySocket from "partysocket/react";
import { useState } from "react";
import {
  RealtimePresenceSchema,
  type RealtimePresenceSchemaType,
  type RealtimeUserSchemaType,
} from "@/realtime/schema";

interface iAppProps {
  room: string;
  user: RealtimeUserSchemaType | null;
}

export function usePresence({ room, user }: iAppProps) {
  const [onlineusers, setOnlineUsers] = useState<RealtimeUserSchemaType[]>([]);
  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "http://localhost:8787",
    room,
    party: "chat",
    onOpen() {
      console.log("Connected to room", room);
      if (user) {
        const message: RealtimePresenceSchemaType = {
          type: "add-user",
          payload: user,
        };
        socket.send(JSON.stringify(message));
      }
    },
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        const res = RealtimePresenceSchema.safeParse(data);

        if (res.success && res.data.type === "presence") {
          setOnlineUsers(res.data.payload.users);
        }
      } catch (error) {
        console.error("Failed to parse message", error);
      }
    },

    onClose() {
      console.log("Disconnected from room", room);
      setOnlineUsers([]);
    },
    onError(error) {
      console.log("Websocket Error", error);
      setOnlineUsers([]);
    },
  });

  return { onlineusers, socket };
}
