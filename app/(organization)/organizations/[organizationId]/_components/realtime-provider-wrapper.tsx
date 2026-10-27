"use client";
import { ConversationRealtimeProvider } from "@/components/conversation-realtime-provider";
import { useConversationScope } from "@/hooks/use-conversation-scope";

export function RealtimeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const scope = useConversationScope();

  if (!scope) return <>{children}</>;

  return (
    <ConversationRealtimeProvider scope={scope}>
      {children}
    </ConversationRealtimeProvider>
  );
}
