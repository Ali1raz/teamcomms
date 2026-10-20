import { type Options, useQueryStates } from "nuqs";
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
import { INVITATION_SORT_FIELDS, INVITATION_STATUSES } from "./constants";

export const invitationParsers = {
  ...paginationParsers,
  search: parseAsString.withDefault(""),
  status: parseAsStringEnum([...INVITATION_STATUSES]),
  role: parseAsStringEnum(Object.values(MembershipRole)),
  sortBy: parseAsStringEnum([...INVITATION_SORT_FIELDS]).withDefault(
    "createdAt"
  ),
  sortOrder: parseAsStringEnum([...SORT_ORDERS]).withDefault("desc"),
};

export type InvitationSearchParams = inferParserType<typeof invitationParsers>;

export const loadInvitationSearchParams = createLoader(invitationParsers);

export function useInvitationFilters(options: Options = {}) {
  return useQueryStates(invitationParsers, { shallow: false, ...options });
}

export function toInvitationQueryInput(
  organizationId: string,
  params: InvitationSearchParams
) {
  return {
    organizationId,
    page: normalizePage(params.page),
    perPage: params.perPage,
    search: params.search || undefined,
    status: params.status ?? undefined,
    role: params.role ?? undefined,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };
}

export function hasActiveInvitationFilters(params: InvitationSearchParams) {
  return Boolean(params.search || params.status || params.role);
}
