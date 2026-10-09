import { type Connection, routePartykitRequest, Server } from "partyserver";
import { z } from "zod";
import {
  RealtimePresenceSchema,
  type RealtimePresenceSchemaType,
  RealtimeReplyEventSchema,
  RealtimeTeamEventSchema,
  RealtimeUserSchema,
} from "./schema";

const ConnectionStateSchema = z
  .object({
    user: RealtimeUserSchema.nullable().optional(),
  })
  .nullable();

type ConnectionState = z.infer<typeof ConnectionStateSchema>;

// Define your Server
export class ChatServer extends Server {
  static options = {
    hibernate: true,
  };

  onConnect(connection: Connection) {
    console.log("Connected", connection.id, "to server", this.name);
    // send initial presence update to the new connection
    connection.send(JSON.stringify(this.getPresenceMEssage()));
  }

  onClose(connection: Connection) {
    console.log("Disconnected", connection.id);
    this.updateUsers();
  }

  onError(connection: Connection) {
    console.log("Connection error", connection.id);
    this.updateUsers();
  }

  onMessage(connection: Connection, message: string) {
    try {
      const parsed = JSON.parse(message);
      const presence = RealtimePresenceSchema.safeParse(parsed);
      if (presence.success) {
        if (presence.data.type === "add-user") {
          this.setCOnnectionState(connection, { user: presence.data.payload });
          // broadcast presence update to all connections
          this.updateUsers();
          return;
        }

        if (presence.data.type === "remove-user") {
          // remove user -> broadcast presence update
          this.setCOnnectionState(connection, null);
          this.updateUsers();
          return;
        }
      }

      const event = RealtimeTeamEventSchema.safeParse(parsed);
      if (event.success) {
        const payload = JSON.stringify(event.data);

        this.broadcast(payload, [connection.id]);
        return;
      }

      const replyEvent = RealtimeReplyEventSchema.safeParse(parsed);
      if (replyEvent.success) {
        const payload = JSON.stringify(replyEvent.data);

        this.broadcast(payload, [connection.id]);
        return;
      }
    } catch (error) {
      console.log("Somthing bad happend!", error);
    }
  }

  updateUsers() {
    const presenceMessage = JSON.stringify(this.getPresenceMEssage());
    this.broadcast(presenceMessage);
  }

  getPresenceMEssage() {
    return {
      type: "presence",
      payload: { users: this.getUsers() },
    } satisfies RealtimePresenceSchemaType;
  }

  getUsers() {
    const users = new Map();
    for (const connection of this.getConnections()) {
      const state = this.getConnectionState(connection);
      if (state?.user) {
        users.set(state.user.id, state.user);
      }
    }
    return Array.from(users.values());
  }

  private getConnectionState(connection: Connection): ConnectionState {
    const result = ConnectionStateSchema.safeParse(connection.state);
    if (result.success) {
      return result.data;
    }
    return null;
  }

  private setCOnnectionState(connection: Connection, state: ConnectionState) {
    connection.setState(state);
  }
}

export default {
  // Set up your fetch handler to use configured Servers
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
