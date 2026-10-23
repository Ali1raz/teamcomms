"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { ConversationScope } from "@/lib/conversation";

export function useConversationScope(): ConversationScope | null {
  const { teamId, channelId } = useParams<{
    teamId?: string;
    channelId?: string;
  }>();

  return useMemo(() => {
    if (teamId) return { kind: "team", teamId };
    if (channelId) return { kind: "channel", channelId };
    return null;
  }, [teamId, channelId]);
}

export function useRequiredConversationScope(): ConversationScope {
  const scope = useConversationScope();
  if (!scope) {
    throw new Error(
      "useRequiredConversationScope must be used inside a team or channel route."
    );
  }
  return scope;
}
