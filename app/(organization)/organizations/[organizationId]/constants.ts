export const ORGANIZATION_TABS = [
  "teams",
  "channels",
  "members",
  "settings",
] as const;

export type OrganizationTab = (typeof ORGANIZATION_TABS)[number];

export const DEFAULT_ORGANIZATION_TAB: OrganizationTab = "teams";

export const CHANNEL_SORT_FIELDS = [
  "name",
  "totalMessages",
  "createdAt",
] as const;

export type ChannelSortField = (typeof CHANNEL_SORT_FIELDS)[number];

export function toChannelSortField(value: string): ChannelSortField | null {
  return (CHANNEL_SORT_FIELDS as readonly string[]).includes(value)
    ? (value as ChannelSortField)
    : null;
}

export const MEMBER_SORT_FIELDS = ["name", "email", "role"] as const;

export type MemberSortField = (typeof MEMBER_SORT_FIELDS)[number];

export function toMemberSortField(value: string): MemberSortField | null {
  return (MEMBER_SORT_FIELDS as readonly string[]).includes(value)
    ? (value as MemberSortField)
    : null;
}

export const TEAM_SORT_FIELDS = ["name", "createdAt"] as const;

export type TeamSortField = (typeof TEAM_SORT_FIELDS)[number];

export function toTeamSortField(value: string): TeamSortField | null {
  return (TEAM_SORT_FIELDS as readonly string[]).includes(value)
    ? (value as TeamSortField)
    : null;
}
