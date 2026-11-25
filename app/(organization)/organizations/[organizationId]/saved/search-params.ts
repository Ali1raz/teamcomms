import { type Options, useQueryStates } from "nuqs";
import {
  createLoader,
  type inferParserType,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { SORT_ORDERS } from "@/lib/app/constants";
import { normalizePage } from "@/lib/pagination";
import { paginationParsers } from "@/lib/search-params/pagination";
import { SAVED_MESSAGE_SORT_FIELDS } from "./constants";

export const savedMessageParsers = {
  ...paginationParsers,
  search: parseAsString.withDefault(""),
  sortBy: parseAsStringEnum([...SAVED_MESSAGE_SORT_FIELDS]).withDefault(
    "savedAt"
  ),
  sortOrder: parseAsStringEnum([...SORT_ORDERS]).withDefault("desc"),
};

export type SavedMessageSearchParams = inferParserType<
  typeof savedMessageParsers
>;

export const loadSavedMessageSearchParams = createLoader(savedMessageParsers);

export function useSavedMessageFilters(options: Options = {}) {
  return useQueryStates(savedMessageParsers, { shallow: false, ...options });
}

export function toSavedMessageQueryInput(
  organizationId: string,
  params: SavedMessageSearchParams
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

export function hasActiveSavedMessageFilters(params: SavedMessageSearchParams) {
  return Boolean(params.search);
}
