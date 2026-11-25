export const SAVED_MESSAGE_SORT_FIELDS = ["savedAt", "createdAt"] as const;

export type SavedMessageSortField = (typeof SAVED_MESSAGE_SORT_FIELDS)[number];
