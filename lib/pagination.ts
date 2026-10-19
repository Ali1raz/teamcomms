export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 10;
export const MAX_PER_PAGE = 100;
export const PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;

export function normalizePage(page: number) {
  return Math.max(page, DEFAULT_PAGE);
}

export function clampPage(page: number, numPages: number) {
  return Math.min(normalizePage(page), Math.max(numPages, DEFAULT_PAGE));
}
