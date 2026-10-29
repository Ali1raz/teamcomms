import z from "zod";
import { MembershipRole } from "@/generated/prisma/enums";
import { conversationScopeSchema } from "@/lib/conversation";
import { createSlug } from "@/lib/utils";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  logo: z.string().nullable().optional(),
});

export type CreateOrganizationType = z.infer<typeof createOrganizationSchema>;

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name must be greater than 2 chars")
    .max(20, "Team name must be less than 20 chars"),
});

export type CreateTeamType = z.infer<typeof createTeamSchema>;

export const channelNameSchema = z
  .string()
  .trim()
  .min(2, "Channel name must be at least 2 characters")
  .max(20, "Channel name must be at most 20 characters")
  .refine(
    (name) => createSlug(name).length > 0,
    "Channel name must include at least one Latin letter or number"
  );

export const createChannelSchema = z.object({
  organizationId: z.string(),
  name: channelNameSchema,
});
export type CreateChannelType = z.infer<typeof createChannelSchema>;

export const updateChannelSchema = z.object({
  channelId: z.string(),
  name: channelNameSchema,
});
export type UpdateChannelType = z.infer<typeof updateChannelSchema>;

// Form-only projections: one field schema, no `.extend` on a refined object.
export const createChannelFormSchema = createChannelSchema.pick({ name: true });
export const renameChannelFormSchema = updateChannelSchema.pick({ name: true });

export const createMessageSchema = z.object({
  content: z.string().trim().min(1, "Message content is required"),
  scope: conversationScopeSchema,
  imageUrl: z.url().optional(),
  threadId: z.string().optional(),
});

export type CreateMessageType = z.infer<typeof createMessageSchema>;

export const listMessagesSchema = z.object({
  scope: conversationScopeSchema,
  limit: z.number().int().min(1).max(100).default(30),
  cursor: z.string().optional(),
  messageId: z.string().optional(),
});
export type ListMessagesType = z.infer<typeof listMessagesSchema>;

export const inviteMemberSchema = z.object({
  email: z.email("Invalid email address"),
  role: z.enum(MembershipRole),
  organizationId: z.string(),
  resend: z.boolean(),
  teamId: z.string().nullable(),
});

export type InviteMemberSchemaType = z.infer<typeof inviteMemberSchema>;

export const updateMessageSchema = z.object({
  messageId: z.string(),
  content: z.string().trim().min(1, "content is required"),
  imageUrl: z.url().nullable().optional(),
});

export type UpdateMessageSchemaType = z.infer<typeof updateMessageSchema>;

export const toggleReactionSchema = z.object({
  messageId: z.string(),
  emoji: z.string().trim().min(1, "Emoji is required"),
});

export type ToggleReactionSchemaType = z.infer<typeof toggleReactionSchema>;

export const RawReactionSchema = z.object({
  emoji: z.string(),
  userId: z.string(),
});

export type RawReactionSchemaType = z.infer<typeof RawReactionSchema>;

export const GroupedReactionSchema = z.object({
  emoji: z.string(),
  count: z.number(),
  reactedByMe: z.boolean(),
});

export type GroupedReactionSchemaType = z.infer<typeof GroupedReactionSchema>;

export const messageListItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  imageUrl: z.string().nullable(),
  createdAt: z.date(),
  repliesCount: z.number(),
  reactions: z.array(GroupedReactionSchema),
  mentionedUserIds: z.array(z.string()).optional(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
  }),
});

export type MessageListItemType = z.infer<typeof messageListItemSchema>;

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 chars")
    .nullable()
    .optional(),
  logo: z.string().nullable().optional(),
});

export type UpdateOrganizationType = z.infer<typeof updateOrganizationSchema>;
