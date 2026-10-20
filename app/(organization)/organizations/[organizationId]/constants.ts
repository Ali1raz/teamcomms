import type { SortOrder } from "@/lib/app/constants";

export const ORGANIZATION_TABS = ["teams", "members"] as const;

export type OrganizationTab = (typeof ORGANIZATION_TABS)[number];

export const DEFAULT_ORGANIZATION_TAB: OrganizationTab = "teams";

export const MEMBER_SORT_FIELDS = ["name", "email", "role"] as const;

export type MemberSortField = (typeof MEMBER_SORT_FIELDS)[number];

export const DEFAULT_MEMBER_SORT_FIELD: MemberSortField = "name";
export const DEFAULT_MEMBER_SORT_ORDER: SortOrder = "asc";

export function toMemberSortField(value: string): MemberSortField | null {
  return (MEMBER_SORT_FIELDS as readonly string[]).includes(value)
    ? (value as MemberSortField)
    : null;
}

export const TEAM_SORT_FIELDS = ["name", "createdAt"] as const;

export type TeamSortField = (typeof TEAM_SORT_FIELDS)[number];

export const DEFAULT_TEAM_SORT_FIELD: TeamSortField = "createdAt";
export const DEFAULT_TEAM_SORT_ORDER: SortOrder = "desc";

export function toTeamSortField(value: string): TeamSortField | null {
  return (TEAM_SORT_FIELDS as readonly string[]).includes(value)
    ? (value as TeamSortField)
    : null;
}
