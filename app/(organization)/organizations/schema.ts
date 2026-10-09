import z from "zod";
import { MembershipRole } from "@/generated/prisma/enums";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
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

export const createMessageSchema = z.object({
  content: z.string().trim().min(1, "Message content is required"),
  teamId: z.string(),
  imageUrl: z.url().optional(),
  threadId: z.string().optional(),
});

export type CreateMessageType = z.infer<typeof createMessageSchema>;

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

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  logo: z.string().nullable().optional(),
});

export type UpdateOrganizationType = z.infer<typeof updateOrganizationSchema>;
