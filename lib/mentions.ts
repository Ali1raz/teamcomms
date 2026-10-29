import type { JSONContent } from "@tiptap/react";
import { prisma } from "@/lib/prisma";

const MAX_MENTIONS = 50;

interface AnalyzedContent {
  plainText: string;
  candidateMentionIds: string[];
}

/**
 * Parses Tiptap JSON content and extracts the plain-text body plus the deduped
 * set of mention candidate ids. Returns null when the content is not valid JSON.
 * Mention markup is excluded from the plain-text body so PII scans never see
 * `@[Name](user_id)` tokens as candidate sensitive values.
 */
export function analyzeContent(raw: string): AnalyzedContent | null {
  let doc: JSONContent;
  try {
    doc = JSON.parse(raw);
  } catch {
    return null;
  }

  const candidateMentionIds = new Set<string>();
  const plainTextParts: string[] = [];

  function walk(node: JSONContent) {
    if (node.type === "mention" && typeof node.attrs?.id === "string") {
      if (candidateMentionIds.size < MAX_MENTIONS) {
        candidateMentionIds.add(node.attrs.id);
      }
      // Mention markup is excluded from PII text.
      return;
    }

    if (node.type === "text") {
      plainTextParts.push(node.text ?? "");
    }

    if (node.content) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }

  if (doc.content) {
    for (const child of doc.content) {
      walk(child);
    }
  }

  return {
    plainText: plainTextParts.join(""),
    candidateMentionIds: Array.from(candidateMentionIds),
  };
}

interface ValidMentionIdsOpts {
  teamId: string | null;
  organizationId: string;
  authorId: string;
  candidateIds: string[];
}

/**
 * Server-side validation of mention candidates. Never trusts client-supplied
 * ids; re-checks membership every time.
 *
 * - Removes the author (you can't mention yourself).
 * - Team scope: validates against TeamMember(teamId, userId).
 * - Channel scope (teamId null): validates against Member(organizationId, userId).
 */
export async function validMentionIds(
  opts: ValidMentionIdsOpts
): Promise<string[]> {
  const candidates = opts.candidateIds.filter((id) => id !== opts.authorId);

  if (candidates.length === 0) {
    return [];
  }

  if (opts.teamId) {
    const members = await prisma.teamMember.findMany({
      where: {
        teamId: opts.teamId,
        userId: { in: candidates },
      },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  const members = await prisma.member.findMany({
    where: {
      organizationId: opts.organizationId,
      userId: { in: candidates },
    },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}
