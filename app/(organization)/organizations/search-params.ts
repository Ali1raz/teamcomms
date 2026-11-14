import {
  type Options,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";

export const organizationRedirectParsers = {
  organizationId: parseAsString,
  next: parseAsString,
};

export type OrganizationRedirectSearchParams = {
  organizationId: string | null;
  next: string | null;
};

export function useOrganizationRedirectParams(options: Options = {}) {
  return useQueryStates(organizationRedirectParsers, {
    shallow: true,
    ...options,
  });
}

export function useOrganizationRedirectParam() {
  return useQueryState("organizationId", parseAsString);
}
