import { z } from "zod";

export type ConversationScope =
  | { kind: "team"; teamId: string }
  | { kind: "channel"; channelId: string };

export const conversationScopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("team"), teamId: z.string().min(1) }),
  z.object({ kind: z.literal("channel"), channelId: z.string().min(1) }),
]);

export type ConversationScopeType = z.infer<typeof conversationScopeSchema>;

export function conversationKey(scope: ConversationScope) {
  return [
    "message.list",
    scope.kind,
    scope.kind === "team" ? scope.teamId : scope.channelId,
  ] as const;
}

export function conversationRoomId(scope: ConversationScope) {
  return scope.kind === "team" ? scope.teamId : scope.channelId;
}
