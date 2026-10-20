import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import { MembershipRole } from "@/generated/prisma/enums";

export const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "canceled",
] as const;

export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const INVITATION_SORT_FIELDS = [
  "createdAt",
  "expiresAt",
  "email",
  "role",
  "status",
] as const;

export type InvitationSortField = (typeof INVITATION_SORT_FIELDS)[number];

export function toInvitationStatus(value: string): InvitationStatus | null {
  return (INVITATION_STATUSES as readonly string[]).includes(value)
    ? (value as InvitationStatus)
    : null;
}

export function toInvitationSortField(
  value: string
): InvitationSortField | null {
  return (INVITATION_SORT_FIELDS as readonly string[]).includes(value)
    ? (value as InvitationSortField)
    : null;
}

export function toMembershipRole(value: string | null): MembershipRole | null {
  return value && Object.hasOwn(MembershipRole, value)
    ? (value as MembershipRole)
    : null;
}

export const invitationStatusVariant: Record<
  string,
  VariantProps<typeof badgeVariants>["variant"]
> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
  canceled: "outline",
};
