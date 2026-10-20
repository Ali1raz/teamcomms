import { type Options, useQueryState, useQueryStates } from "nuqs";
import {
  createLoader,
  type inferParserType,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { MembershipRole } from "@/generated/prisma/enums";
import { SORT_ORDERS } from "@/lib/app/constants";
import { normalizePage } from "@/lib/pagination";
import { paginationParsers } from "@/lib/search-params/pagination";
import {
  DEFAULT_MEMBER_SORT_FIELD,
  DEFAULT_MEMBER_SORT_ORDER,
  DEFAULT_ORGANIZATION_TAB,
  DEFAULT_TEAM_SORT_FIELD,
  DEFAULT_TEAM_SORT_ORDER,
  MEMBER_SORT_FIELDS,
  ORGANIZATION_TABS,
  TEAM_SORT_FIELDS,
} from "./constants";

export const organizationTabParser = parseAsStringEnum([
  ...ORGANIZATION_TABS,
]).withDefault(DEFAULT_ORGANIZATION_TAB);

export const organizationMemberParsers = {
  ...paginationParsers,
  search: parseAsString.withDefault(""),
  role: parseAsStringEnum([...Object.values(MembershipRole)]),
  sortBy: parseAsStringEnum([...MEMBER_SORT_FIELDS]).withDefault(
    DEFAULT_MEMBER_SORT_FIELD
  ),
  sortOrder: parseAsStringEnum([...SORT_ORDERS]).withDefault(
    DEFAULT_MEMBER_SORT_ORDER
  ),
};

export type OrganizationMemberSearchParams = inferParserType<
  typeof organizationMemberParsers
>;

export const loadOrganizationMemberSearchParams = createLoader(
  organizationMemberParsers
);

export const teamParsers = {
  ...paginationParsers,
  search: parseAsString.withDefault(""),
  sortBy: parseAsStringEnum([...TEAM_SORT_FIELDS]).withDefault(
    DEFAULT_TEAM_SORT_FIELD
  ),
  sortOrder: parseAsStringEnum([...SORT_ORDERS]).withDefault(
    DEFAULT_TEAM_SORT_ORDER
  ),
};

export type TeamSearchParams = inferParserType<typeof teamParsers>;

export const teamUrlKeys = {
  search: "teamSearch",
  sortBy: "teamSortBy",
  sortOrder: "teamSortOrder",
  page: "teamPage",
  perPage: "teamPerPage",
} as const;

export const loadTeamSearchParams = createLoader(teamParsers, {
  urlKeys: teamUrlKeys,
});

export function useOrganizationTab() {
  return useQueryState("tab", organizationTabParser);
}

export function useOrganizationMemberFilters(options: Options = {}) {
  return useQueryStates(organizationMemberParsers, {
    shallow: false,
    ...options,
  });
}

export function toOrganizationMemberQueryInput(
  organizationId: string,
  params: OrganizationMemberSearchParams
) {
  return {
    organizationId,
    page: normalizePage(params.page),
    perPage: params.perPage,
    search: params.search || undefined,
    role: params.role ?? undefined,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };
}

export function hasActiveOrganizationMemberFilters(
  params: OrganizationMemberSearchParams
) {
  return Boolean(params.search || params.role);
}

export function useTeamFilters(options: Options = {}) {
  return useQueryStates(teamParsers, {
    shallow: false,
    urlKeys: teamUrlKeys,
    ...options,
  });
}

export function toTeamQueryInput(
  organizationId: string,
  params: TeamSearchParams
) {
  return {
    organizationId,
    page: normalizePage(params.page),
    perPage: params.perPage,
    search: params.search || undefined,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };
}

export function hasActiveTeamFilters(params: TeamSearchParams) {
  return Boolean(params.search);
}
