"use client";

import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { GroupedReactionSchemaType } from "@/app/(organization)/organizations/schema";
import { useRealtimeTeam } from "@/components/team-realtime-provider";
import { Button } from "@/components/ui/button";
import { type client, orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { ReactionEmojiPicker } from "./reaction-emoji-picker";

interface ReactionBarProps {
  messageId: string;
  reactions: GroupedReactionSchemaType[];
}

// Shape of a single message.list page as stored in the infinite query cache.
type MessagePage = Awaited<ReturnType<typeof client.message.list>>;
type InfiniteMessages = InfiniteData<MessagePage, string | undefined>;
type ThreadData = Awaited<ReturnType<typeof client.message.threads.list>>;

// Partial query keys matching every cached message.list / threads.list query.
// The same message (e.g. a thread parent) lives in both caches, so a reaction
// has to update them together or the two views drifts out of sync.
const messageListKey = ["message.list"];
const threadListKey = orpc.message.threads.list.key({
  type: "query",
});

/**
 * Apply a reaction toggle optimistically on a grouped reaction list.
 *
 * A user can only react once per message, so selecting a new emoji while the
 * user already reacted swaps the previous one out.
 */
function toggleReactionOptimistic(
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

/** Optimistically update a cached message.list page for the toggled message. */
function updateMessageListReactions(
  data: InfiniteMessages | undefined,
  messageId: string,
  emoji: string
) {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              reactions: toggleReactionOptimistic(message.reactions, emoji),
            }
          : message
      ),
    })),
  };
}

/** Optimistically update the cached thread data (parent + replies). */
function updateThreadDataReactions(
  data: ThreadData | undefined,
  messageId: string,
  emoji: string
) {
  if (!data) return data;
  return {
    ...data,
    parent:
      data.parent.id === messageId
        ? {
            ...data.parent,
            reactions: toggleReactionOptimistic(data.parent.reactions, emoji),
          }
        : data.parent,
    threads: data.threads.map((thread) =>
      thread.id === messageId
        ? {
            ...thread,
            reactions: toggleReactionOptimistic(thread.reactions, emoji),
          }
        : thread
    ),
  };
}

export function ReactionBar({ messageId, reactions }: ReactionBarProps) {
  const queryClient = useQueryClient();
  const { send } = useRealtimeTeam();

  const toggleReactionMutation = useMutation(
    orpc.message.reaction.toggle.mutationOptions({
      onMutate: async (variables) => {
        // Stop in-flight refetches so they don't overwrite the optimistic value.
        await queryClient.cancelQueries({ queryKey: messageListKey });
        await queryClient.cancelQueries({ queryKey: threadListKey });

        // Snapshot both caches so we can roll back if the server rejects it.
        const prevMessages = queryClient.getQueriesData<InfiniteMessages>({
          queryKey: messageListKey,
        });
        const prevThreads = queryClient.getQueriesData<ThreadData>({
          queryKey: threadListKey,
        });

        queryClient.setQueriesData<InfiniteMessages>(
          { queryKey: messageListKey },
          (old) =>
            updateMessageListReactions(
              old,
              variables.messageId,
              variables.emoji
            )
        );
        queryClient.setQueriesData<ThreadData>(
          { queryKey: threadListKey },
          (old) =>
            updateThreadDataReactions(old, variables.messageId, variables.emoji)
        );

        return { prevMessages, prevThreads };
      },

      onSuccess: (data) => {
        const toggled = data.reactions.find((reaction) => reaction.reactedByMe);
        toast.success(toggled ? "Reaction added" : "Reaction removed");

        // Broadcast the new reaction state to everyone in this team so the
        // message list and open thread panels stay in sync live.
        send({
          type: "reaction:updated",
          payload: { messageId: data.messageId, reactions: data.reactions },
        });
      },

      onError: (error, _variables, ctx) => {
        // Roll both caches back to their snapshots.
        if (ctx) {
          for (const [queryKey, data] of ctx.prevMessages) {
            queryClient.setQueryData(queryKey, data);
          }
          for (const [queryKey, data] of ctx.prevThreads) {
            queryClient.setQueryData(queryKey, data);
          }
        }
        toast.error("Failed to update reaction", {
          description: error.message,
        });
      },

      onSettled: () => {
        // Re-sync both views with the server once the mutation settles.
        queryClient.invalidateQueries({ queryKey: messageListKey });
        queryClient.invalidateQueries({ queryKey: threadListKey });
      },
    })
  );

  function handleToggle(emoji: string) {
    toggleReactionMutation.mutate({ messageId, emoji });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          type="button"
          variant={reaction.reactedByMe ? "outline" : "ghost"}
          size="xs"
          className={cn(
            "h-6 gap-1 rounded-full px-2",
            reaction.reactedByMe && "border-primary bg-primary/10 text-primary"
          )}
          onClick={() => handleToggle(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}
      <ReactionEmojiPicker onSelect={handleToggle} />
    </div>
  );
}
