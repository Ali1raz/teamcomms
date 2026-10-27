"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ConversationScope } from "@/lib/conversation";
import { conversationKey } from "@/lib/conversation";
import { orpc } from "@/lib/orpc";
import { isOrpcErrorWithCode } from "@/lib/orpc-error";

export function useConversationErrorRecovery(scope: ConversationScope) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { organizationId } = useParams<{ organizationId: string }>();

  return (error: unknown): boolean => {
    if (scope.kind !== "channel") return false;
    if (!isOrpcErrorWithCode(error, "NOT_FOUND")) return false;

    queryClient.removeQueries({ queryKey: conversationKey(scope) });
    void queryClient.invalidateQueries({
      queryKey: orpc.channel.list.queryKey({ input: { organizationId } }),
    });
    toast.error("This channel was deleted.");
    router.push(`/organizations/${organizationId}`);
    return true;
  };
}
