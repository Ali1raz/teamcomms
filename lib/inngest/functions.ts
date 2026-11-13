import { SendEmail } from "@/app/action";
import { provisionDefaultChannels } from "@/lib/channel-provisioning";
import { analyzeContent } from "@/lib/mentions";
import { prisma } from "@/lib/prisma";
import { env } from "../env";
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
          threadId: true,
          teamId: true,
          channelId: true,
          user: { select: { name: true } },
          team: { select: { name: true, organizationId: true } },
          channel: { select: { name: true, organizationId: true } },
        },
      });
      if (!message) return null;

      // Derive the organization from the message itself so events queued by an
      // edit (which don't carry it) still resolve the right scope.
      const organizationId =
        message.team?.organizationId ?? message.channel?.organizationId;
      if (!organizationId) return null;

      // Re-check the DB so a mention removed by a quick edit isn't emailed,
      // and so recipients who lost team/org membership don't get the mail.
      const recipients = await prisma.user.findMany({
        where: {
          id: { in: mentionedUserIds },
          mentions: { some: { messageId } },
          ...(message.teamId
            ? { teammembers: { some: { teamId: message.teamId } } }
            : { members: { some: { organizationId } } }),
        },
        select: { id: true, email: true },
      });

      const isThread = Boolean(message.threadId);
      const conversationId = message.teamId ?? message.channelId ?? "";
      const conversationKind = message.teamId ? "team" : "channel";

      return {
        authorName: message.user.name,
        conversationName:
          message.team?.name ?? message.channel?.name ?? "a conversation",
        snippet: analyzeContent(message.content)?.plainText.slice(0, 140) ?? "",
        organizationId,
        recipients,
        isThread,
        conversationId,
        conversationKind,
        parentId: isThread ? message.threadId : null,
      };
    });

    if (!loaded || !loaded.recipients.length) {
      return { skipped: true, reason: "no-recipients" };
    }

    for (const recipient of loaded.recipients) {
      // Per-recipient step ids stay stable across retries and unique per user,
      // so one failed send retries without re-sending to everyone else.
      await step.run(`send-mention-email-${recipient.id}`, async () => {
        const result = await SendEmail({
          to: recipient.email,
          subject: `${loaded.authorName} mentioned you in ${loaded.conversationName}`,
          meta: {
            description:
              loaded.snippet.trim() || "You were mentioned in a message.",
            link: `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/organizations/${loaded.organizationId}/${loaded.conversationKind}/${loaded.conversationId}?messageId=${loaded.isThread ? loaded.parentId : messageId}${loaded.isThread ? `&threadId=${messageId}` : ""}`,
          },
        });
        // SendEmail returns { success: false } instead of throwing, so throw here or Inngest never retries.
        if (!result.success) throw new Error("Mention email failed");
      });
    }

    return { sent: loaded.recipients.length };
  }
);
