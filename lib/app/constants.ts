export const SORT_ORDERS = ["asc", "desc"] as const;

export type SortOrder = (typeof SORT_ORDERS)[number];
export const SIDEBAR_MEMBER_PREVIEW_COUNT = 1;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 10;
export const MAX_PER_PAGE = 100;
export const PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;
