import { DEFAULT_PAGE } from "./app/constants";

export function normalizePage(page: number) {
  return Math.max(page, DEFAULT_PAGE);
}

export function clampPage(page: number, numPages: number) {
  return Math.min(normalizePage(page), Math.max(numPages, DEFAULT_PAGE));
}
