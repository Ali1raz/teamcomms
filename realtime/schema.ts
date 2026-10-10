import { z } from "zod";
import { GroupedReactionSchema } from "@/app/(organization)/organizations/schema";

export const RealtimeUserSchema = z.object({
  id: z.string(),
});

export type RealtimeUserSchemaType = z.infer<typeof RealtimeUserSchema>;

export const RealtimePresenceSchema = z.union([
  z.object({
    type: z.literal("add-user"),
    payload: RealtimeUserSchema,
  }),
  z.object({
    type: z.literal("remove-user"),
    payload: z.object({
      id: z.string(),
    }),
  }),
  z.object({
    type: z.literal("presence"),
    payload: z.object({ users: z.array(RealtimeUserSchema) }),
  }),
]);

export type RealtimePresenceSchemaType = z.infer<typeof RealtimePresenceSchema>;

export const RealtimeMessageSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  teamId: z.string().nullable(),
  threadId: z.string().nullable(),
  content: z.string(),
  imageUrl: z.string().nullable().optional(),
  repliesCount: z.number().optional(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
    email: z.string(),
  }),
});

export type RealtimeMessageSchemaType = z.infer<typeof RealtimeMessageSchema>;

export const RealtimeTeamEventSchema = z.union([
  z.object({
    type: z.literal("message:created"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("message:updated"),
    payload: z.object({ message: RealtimeMessageSchema }),
  }),
  z.object({
    type: z.literal("reaction:added"),
    payload: z.object({ messageId: z.string(), emoji: z.string() }),
  }),
  z.object({
    type: z.literal("message:reply:increment"),
    payload: z.object({ messageId: z.string(), delta: z.number() }),
  }),
  z.object({
    type: z.literal("message:deleted"),
    payload: z.object({ messageId: z.string() }),
  }),
  z.object({
    type: z.literal("reaction:updated"),
    payload: z.object({
      messageId: z.string(),
      reactions: z.array(GroupedReactionSchema),
    }),
  }),
]);

export type RealtimeTeamEventSchemaType = z.infer<
  typeof RealtimeTeamEventSchema
>;

export const RealtimeReplySchema = z.object({
  id: z.string(),
  content: z.string(),
  imageUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
  }),
});

export type RealtimeReplySchemaType = z.infer<typeof RealtimeReplySchema>;

export const RealtimeReplyEventSchema = z.union([
  z.object({
    type: z.literal("reply:created"),
    payload: z.object({ reply: RealtimeReplySchema }),
  }),
  z.object({
    type: z.literal("reply:updated"),
    payload: z.object({ reply: RealtimeReplySchema }),
  }),
  z.object({
    type: z.literal("reply:deleted"),
    payload: z.object({ replyId: z.string() }),
  }),
]);

export type RealtimeReplyEventSchemaType = z.infer<
  typeof RealtimeReplyEventSchema
>;
