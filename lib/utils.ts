import { generateJSON } from "@tiptap/react";
import { renderToMarkdown } from "@tiptap/static-renderer/pm/markdown";
import { type ClassValue, clsx } from "clsx";
import Dompurify from "dompurify";
import MarkdownIt from "markdown-it";
import { twMerge } from "tailwind-merge";
import { baseExtensions } from "@/components/editor/extensions";
import { COLOR_COMBOS } from "./app/data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Collapse a list of raw reactions into per-emoji groups with counts.
 *
 * `reactedByMe` is true when the current user appears among the reactions for
 * that emoji, which the UI uses to highlight reactions the user has added.
 */
export function groupReactions(
  reactions: { emoji: string; userId: string }[],
  userId: string
) {
  const reactionMap = new Map<
    string,
    { count: number; reactedByMe: boolean }
  >();

  for (const reaction of reactions) {
    const existing = reactionMap.get(reaction.emoji);

    if (existing) {
      reactionMap.set(reaction.emoji, {
        count: existing.count + 1,
        reactedByMe: existing.reactedByMe || reaction.userId === userId,
      });
    } else {
      reactionMap.set(reaction.emoji, {
        count: 1,
        reactedByMe: reaction.userId === userId,
      });
    }
  }

  return Array.from(reactionMap, ([emoji, { count, reactedByMe }]) => ({
    emoji,
    count,
    reactedByMe,
  }));
}

export function getOrganizationColor(id: string) {
  const charsum = id
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const colorIndex = charsum % COLOR_COMBOS.length;

  return COLOR_COMBOS[colorIndex];
}

export function createSlug(input: string) {
  // Derive a safe organization slug from user input and strip edge dashes.
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createAvatarUrl(seed = "ar") {
  // Build a deterministic DiceBear avatar URL so the same seed always returns the same avatar.
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Relative time label for message timestamps.
 *
 * < 1 min   → "just now"
 * < 1 h     → "5 min"
 * < 24 h    → "3 h"
 * < 30 d    → "12 d"
 * < 1 year  → "May 26"
 * otherwise → "May 2012"
 */
export function formatRelativeTime(date: string | number | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min`;
  if (diffH < 24) return `${diffH} h`;
  if (diffD < 30) return `${diffD} d`;

  const sameYear = now.getFullYear() === d.getFullYear();

  if (sameYear) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // "May 26"
  }

  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }); // "May 2012"
}

export function formatLocalDateTime(createdAt: string | number | Date) {
  // Keep date formatting consistent across the app while still respecting the user's local timezone.
  return new Date(createdAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * trim trailing whitespaces and collapse >2 blank lines
 */
function normalizeWhitespace(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Converts a JSON string to a Markdown string using the Tiptap static renderer.
 *
 * see https://tiptap.dev/docs/editor/api/utilities/static-renderer
 */
export async function jsonToMarkdown(json: string) {
  let content;
  try {
    content = JSON.parse(json);
  } catch {
    return "";
  }

  return normalizeWhitespace(
    renderToMarkdown({
      extensions: baseExtensions,
      content,
    })
  );
}

const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

export function markdownToJson(markdown: string) {
  const html = md.render(markdown);
  const cleaned = Dompurify.sanitize(html, { USE_PROFILES: { html: true } });

  return generateJSON(cleaned, baseExtensions);
}
