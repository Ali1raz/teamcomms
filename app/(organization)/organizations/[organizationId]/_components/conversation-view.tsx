import type { ConversationScope } from "@/lib/conversation";
import { MessageList } from "./MessageList";
import { MessageInput } from "./message-input";

export function ConversationView({ scope }: { scope: ConversationScope }) {
  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="my-4 min-h-0 flex-1">
        <MessageList scope={scope} />
      </div>

      <div className="shrink-0 bg-background p-2 pb-3 pt-0">
        <MessageInput scope={scope} />
      </div>
    </section>
  );
}
