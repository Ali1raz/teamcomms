import type { GroupedReactionSchemaType } from "@/app/(organization)/organizations/schema";

/**
 * Apply a reaction toggle optimistically on a grouped reaction list.
 *
 * A user can only react once per message, so selecting a new emoji while the
 * user already reacted swaps the previous one out.
 */
export function toggleReactionOptimistic(
  reactions: GroupedReactionSchemaType[],
  emoji: string
): GroupedReactionSchemaType[] {
  const mine = reactions.find((reaction) => reaction.reactedByMe);

  // Clicking my current reaction removes it (toggle off).
  if (mine?.emoji === emoji) {
    return reactions
      .map((reaction) =>
        reaction.emoji === emoji
          ? { ...reaction, count: reaction.count - 1, reactedByMe: false }
          : reaction
      )
      .filter((reaction) => reaction.count > 0);
  }

  // Drop my previous reaction first (one reaction per message)...
  const withoutMine = mine
    ? reactions
        .map((reaction) =>
          reaction.emoji === mine.emoji
            ? { ...reaction, count: reaction.count - 1, reactedByMe: false }
            : reaction
        )
        .filter((reaction) => reaction.count > 0)
    : reactions;

  // ...then react with (or increment) the newly selected emoji.
  return withoutMine.some((reaction) => reaction.emoji === emoji)
    ? withoutMine.map((reaction) =>
        reaction.emoji === emoji
          ? { ...reaction, count: reaction.count + 1, reactedByMe: true }
          : reaction
      )
    : [...withoutMine, { emoji, count: 1, reactedByMe: true }];
}

/**
 * Replace the reactions of a single message in a cached infinite message.list
 * query. A message only lives in one page, so every page is scanned.
 */
export function replaceReactionsInMessageList<
  TMessage extends { id: string },
  TPage extends { messages: TMessage[] },
  TData extends { pages: TPage[] },
>(
  data: TData | undefined,
  messageId: string,
  reactions: GroupedReactionSchemaType[]
): TData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) =>
        message.id === messageId ? { ...message, reactions } : message
      ),
    })),
  };
}

/**
 * Replace the reactions of a message in a cached threads.list query. The same
 * message can appear as the thread parent or as one of the replies.
 */
export function replaceReactionsInThread<
  TMessage extends { id: string },
  TData extends { parent: TMessage; threads: TMessage[] },
>(
  data: TData | undefined,
  messageId: string,
  reactions: GroupedReactionSchemaType[]
): TData | undefined {
  if (!data) return data;
  return {
    ...data,
    parent:
      data.parent.id === messageId
        ? { ...data.parent, reactions }
        : data.parent,
    threads: data.threads.map((thread) =>
      thread.id === messageId ? { ...thread, reactions } : thread
    ),
  };
}
