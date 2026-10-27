"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { MentionUser } from "@/components/editor/mentions";
import type { ConversationScope } from "@/lib/conversation";
import { orpc } from "@/lib/orpc";

export function useMentionUsers(scope: ConversationScope) {
  const { data: currentUser } = useSuspenseQuery(orpc.user.get.queryOptions());

  const { data: mentionData } = useSuspenseQuery(
    orpc.user.mention.queryOptions({
      input: {
        teamId: scope.kind === "team" ? scope.teamId : undefined,
      },
    })
  );

  const users: MentionUser[] = (mentionData?.users ?? []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? undefined,
  }));

  return { users, currentUser };
}
