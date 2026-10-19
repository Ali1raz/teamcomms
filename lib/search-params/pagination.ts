import { type inferParserType, parseAsInteger } from "nuqs/server";
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from "@/lib/pagination";

export const paginationParsers = {
  page: parseAsInteger.withDefault(DEFAULT_PAGE),
  perPage: parseAsInteger.withDefault(DEFAULT_PER_PAGE),
};

export type PaginationSearchParams = inferParserType<typeof paginationParsers>;
