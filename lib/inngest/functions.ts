import { SendEmail } from "@/app/action";
import { provisionDefaultChannels } from "@/lib/channel-provisioning";
import { analyzeContent } from "@/lib/mentions";
import { prisma } from "@/lib/prisma";
import { inngest } from "./client";

export const sendMentionEmails = inngest.createFunction(
  {
    id: "message-send-mention-emails",
    triggers: [{ event: "message/users.mentioned" }],
    retries: 4,
  },
  async ({ event, step }) => {
    const { messageId, mentionedUserIds } = event.data;

    const loaded = await step.run("load-mention-context", async () => {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: {
          content: true,
          user: { select: { name: true } },
          team: { select: { name: true } },
          channel: { select: { name: true } },
        },
      });
      if (!message) return null;

      // Re-check the DB so a mention removed by a quick edit isn't emailed.
      const recipients = await prisma.user.findMany({
        where: {
          id: { in: mentionedUserIds },
          mentions: { some: { messageId } },
        },
        select: { id: true, email: true },
      });

      return {
        authorName: message.user.name,
        conversationName:
          message.team?.name ?? message.channel?.name ?? "a conversation",
        snippet: analyzeContent(message.content)?.plainText.slice(0, 140) ?? "",
        recipients,
      };
    });

    if (!loaded || !loaded.recipients.length) {
      return { skipped: true, reason: "no-recipients" };
    }

    for (const recipient of loaded.recipients) {
      await step.run("send-mention-email", async () => {
        const result = await SendEmail({
          to: recipient.email,
          subject: `${loaded.authorName} mentioned you in ${loaded.conversationName}`,
          meta: {
            description: loaded.snippet || "You were mentioned in a message.",
          },
        });
        // SendEmail returns { success: false } instead of throwing, so throw here or Inngest never retries.
        if (!result.success) throw new Error("Mention email failed");
      });
    }

    return { sent: loaded.recipients.length };
  }
);
