import z from "zod";
import type { Message } from "@/generated/prisma/client";
import { sensitiveInfoAj } from "@/lib/arcjet-helpers";
import type { ConversationScopeType } from "@/lib/conversation";
import { inngest } from "@/lib/inngest/client";
import { analyzeContent, validMentionIds } from "@/lib/mentions";
import { prisma } from "@/lib/prisma";
import { groupReactions } from "@/lib/utils";
import {
  createMessageSchema,
  listMessagesSchema,
  messageListItemSchema,
  RawReactionSchema,
  toggleReactionSchema,
  updateMessageSchema,
} from "../(organization)/organizations/schema";
import { readsecurityMiddleware } from "../middlewares/arcjet/read";
import { standardsecurityMiddleware } from "../middlewares/arcjet/standard";
import { writesecurityMiddleware } from "../middlewares/arcjet/write";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";
import { requireOrganizationMiddleware } from "../middlewares/organization";

async function findConversationInOrganization(
  scope: ConversationScopeType,
  organizationId: string
) {
  if (scope.kind === "team") {
    return prisma.team.findFirst({
      where: { id: scope.teamId, organizationId },
      select: { id: true },
    });
  }
  return prisma.channel.findFirst({
    where: { id: scope.channelId, organizationId },
    select: { id: true },
  });
}

function messageScopeWhere(scope: ConversationScopeType) {
  return scope.kind === "team"
    ? { teamId: scope.teamId }
    : { channelId: scope.channelId };
}

function organizationScopeWhere(organizationId: string) {
  return {
    OR: [{ team: { organizationId } }, { channel: { organizationId } }],
  };
}

export const createMessage = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "POST",
    path: "/messages",
    summary: "create new message",
    tags: ["message"],
  })
  .input(createMessageSchema)
  .output(z.custom<Message & { mentionedUserIds: string[] }>())
  .handler(async ({ context, input, errors }) => {
    // Run the PII check here because the middleware layer cannot see parsed input.
    const analyzed = analyzeContent(input.content);
    if (!analyzed || (!analyzed.plainText && !input.imageUrl)) {
      throw errors.BAD_REQUEST({ message: "Message content is required" });
    }

    const sensitiveInfoDecision = await sensitiveInfoAj().protect(
      context.request,
      {
        userId: context.user.id,
        // image-only messages have no plain text; fall back to the raw content
        // so the PII check still runs on whatever text exists.
        sensitiveInfoValue: analyzed.plainText ?? input.content,
      }
    );

    if (sensitiveInfoDecision.isDenied()) {
      if (sensitiveInfoDecision.reason.isSensitiveInfo()) {
        throw errors.FORBIDDEN({
          message:
            "Sensitive information detected. Please remove PII (e.g. credit card numbers, phone numbers) and try again!",
        });
      }

      throw errors.FORBIDDEN({
        message: "Request blocked!",
      });
    }

    const conversation = await findConversationInOrganization(
      input.scope,
      context.organization.id
    );

    if (!conversation) {
      throw errors.NOT_FOUND({ message: "Conversation not found" });
    }

    const scopeWhere = messageScopeWhere(input.scope);

    if (input.threadId) {
      const parentMessage = await prisma.message.findFirst({
        where: {
          id: input.threadId,
          threadId: null,
          ...scopeWhere,
        },
        select: { id: true },
      });

      if (!parentMessage) {
        throw errors.BAD_REQUEST({ message: "Parent message not found" });
      }
    }

    const scopeTeamId = input.scope.kind === "team" ? input.scope.teamId : null;

    const mentionedUserIds = await validMentionIds({
      teamId: scopeTeamId,
      organizationId: context.organization.id,
      authorId: context.user.id,
      candidateIds: analyzed?.candidateMentionIds ?? [],
    });

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          content: input.content,
          imageUrl: input.imageUrl,
          userId: context.user.id,
          threadId: input.threadId,
          ...scopeWhere,
          mentions: {
            createMany: {
              data: mentionedUserIds.map((userId) => ({ userId })),
            },
          },
        },
      });
      return created;
    });

    if (mentionedUserIds.length) {
      try {
        await inngest.send({
          id: `message-users-mentioned-${message.id}`, // dedupes duplicate sends
          name: "message/users.mentioned",
          data: {
            messageId: message.id,
            mentionedUserIds,
            organizationId: context.organization.id,
            teamId: scopeTeamId,
          },
        });
      } catch (error) {
        // The message is already saved; a queue failure must not fail the send.
        console.error("Failed to queue mention emails", error);
      }
    }

    return { ...message, mentionedUserIds };
  });

export const listMessages = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .use(readsecurityMiddleware)
  .route({
    method: "GET",
    path: "/messages",
    summary: "List messages",
    tags: ["message"],
  })
  .input(listMessagesSchema)
  .output(
    z.object({
      messages: z.array(messageListItemSchema),
      nextCursor: z.string().nullable(),
    })
  )
  .handler(async ({ context, errors, input }) => {
    const conversation = await findConversationInOrganization(
      input.scope,
      context.organization.id
    );

    if (!conversation) {
      throw errors.NOT_FOUND({ message: "Conversation not found" });
    }

    const limit = input.limit;

    // When a messageId is supplied, filter down to that single message so the
    // UI can surface a specific message (e.g. from a mention email link).
    if (input.messageId) {
      const message = await prisma.message.findFirst({
        where: {
          id: input.messageId,
          threadId: null,
          ...messageScopeWhere(input.scope),
          ...organizationScopeWhere(context.organization.id),
        },
        select: {
          id: true,
          content: true,
          imageUrl: true,
          createdAt: true,
          _count: { select: { replies: true } },
          reactions: {
            orderBy: { createdAt: "asc" },
            select: {
              emoji: true,
              userId: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          mentions: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!message) {
        return { messages: [], nextCursor: null };
      }

      return {
        messages: [
          {
            ...message,
            repliesCount: message._count.replies,
            reactions: groupReactions(message.reactions, context.user.id),
            mentionedUserIds: message.mentions.map((m) => m.userId),
          },
        ],
        nextCursor: null,
      };
    }

    const messages = await prisma.message.findMany({
      where: {
        threadId: null,
        ...messageScopeWhere(input.scope),
      },
      ...(input.cursor
        ? {
            cursor: {
              id: input.cursor,
            },
            skip: 1,
          }
        : {}),
      take: limit,
      orderBy: [
        {
          createdAt: "desc",
        },
        { id: "desc" },
      ],
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        _count: { select: { replies: true } },
        reactions: {
          orderBy: { createdAt: "asc" },
          select: {
            emoji: true,
            userId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        mentions: {
          select: {
            userId: true,
          },
        },
      },
    });

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : null;

    return {
      messages: messages.map(({ _count, reactions, mentions, ...message }) => ({
        ...message,
        repliesCount: _count.replies,
        reactions: groupReactions(reactions, context.user.id),
        mentionedUserIds: mentions.map((m) => m.userId),
      })),
      nextCursor,
    };
  });

export const updateMessage = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "PUT",
    path: "/messages/:messageId",
    summary: "update message",
    tags: ["message"],
  })
  .input(updateMessageSchema)
  .output(
    z.object({
      message: z.custom<Message>(),
      canEdit: z.boolean(),
    })
  )
  .handler(async ({ context, input, errors }) => {
    // Run the PII check here because the middleware layer cannot see parsed input.
    const analyzed = analyzeContent(input.content);
    if (!analyzed || (!analyzed.plainText && !input.imageUrl)) {
      throw errors.BAD_REQUEST({ message: "Message content is required" });
    }

    const sensitiveInfoDecision = await sensitiveInfoAj().protect(
      context.request,
      {
        userId: context.user.id,
        // image-only messages have no plain text; fall back to the raw content
        // so the PII check still runs on whatever text exists.
        sensitiveInfoValue: analyzed.plainText ?? input.content,
      }
    );

    if (sensitiveInfoDecision.isDenied()) {
      if (sensitiveInfoDecision.reason.isSensitiveInfo()) {
        throw errors.FORBIDDEN({
          message:
            "Sensitive information detected. Please remove PII (e.g. credit card numbers, phone numbers) and try again!",
        });
      }

      throw errors.FORBIDDEN({
        message: "Request blocked!",
      });
    }

    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        ...organizationScopeWhere(context.organization.id),
      },
      select: {
        id: true,
        userId: true,
        teamId: true,
        mentions: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!message) {
      throw errors.NOT_FOUND();
    }

    if (message.userId !== context.user.id) {
      throw errors.FORBIDDEN();
    }

    const mentionedUserIds = await validMentionIds({
      teamId: message.teamId ?? null,
      organizationId: context.organization.id,
      authorId: context.user.id,
      candidateIds: analyzed?.candidateMentionIds ?? [],
    });

    const previousIds = new Set(message.mentions.map((m) => m.userId));
    const newlyMentionedIds = mentionedUserIds.filter(
      (id) => !previousIds.has(id)
    );

    const updatedMessage = await prisma.$transaction(async (tx) => {
      const updated = await tx.message.update({
        where: {
          id: input.messageId,
        },
        data: {
          content: input.content,
          // Preserve attachment edits from the message editor instead of silently dropping them.
          imageUrl: input.imageUrl,
          mentions: {
            deleteMany: {},
            createMany: {
              data: mentionedUserIds.map((userId) => ({ userId })),
            },
          },
        },
      });
      return updated;
    });

    if (newlyMentionedIds.length) {
      try {
        await inngest.send({
          id: `message-users-mentioned-${input.messageId}-${updatedMessage.updatedAt.getTime()}`,
          name: "message/users.mentioned",
          data: {
            messageId: updatedMessage.id,
            mentionedUserIds: newlyMentionedIds,
          },
        });
      } catch (error) {
        console.error("Failed to queue mention emails", error);
      }
    }

    return {
      message: updatedMessage,
      canEdit: message.userId === context.user.id,
    };
  });

export const deleteMessage = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "DELETE",
    path: "/messages/:messageId",
    summary: "Delete a message",
    tags: ["message"],
  })
  .input(
    z.object({
      messageId: z.string(),
    })
  )
  .output(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ context, input, errors }) => {
    // Verify the message exists and belongs to the current organization
    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        ...organizationScopeWhere(context.organization.id),
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!message) {
      throw errors.NOT_FOUND();
    }

    // Only the message author may delete their own message
    if (message.userId !== context.user.id) {
      throw errors.FORBIDDEN({
        message: "You do not have permission to delete this message.",
      });
    }

    await prisma.message.delete({
      where: { id: input.messageId },
    });

    return { id: input.messageId };
  });

export const toggleReaction = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "POST",
    path: "/messages/:messageId/reactions",
    summary: "Toggle a reaction on a message",
    tags: ["message"],
  })
  .input(toggleReactionSchema)
  .output(
    z.object({
      messageId: z.string(),
      reactions: z.array(RawReactionSchema),
    })
  )
  .handler(async ({ context, input, errors }) => {
    // Verify the message exists and belongs to the current organization
    const message = await prisma.message.findFirst({
      where: {
        id: input.messageId,
        ...organizationScopeWhere(context.organization.id),
      },
      select: {
        id: true,
      },
    });

    if (!message) {
      throw errors.NOT_FOUND();
    }

    const existing = await prisma.messageReaction.findUnique({
      where: {
        userId_messageId: {
          userId: context.user.id,
          messageId: input.messageId,
        },
      },
      select: {
        emoji: true,
      },
    });

    // A user can only react once per message. Reacting again with the same
    // emoji removes the reaction (toggle off); a different emoji swaps it.
    // deleteMany + upsert keep these writes race-safe: a concurrent request
    // can no longer trip the unique constraint between read and write.
    if (existing?.emoji === input.emoji) {
      await prisma.messageReaction.deleteMany({
        where: {
          userId: context.user.id,
          messageId: input.messageId,
        },
      });
    } else {
      await prisma.messageReaction.upsert({
        where: {
          userId_messageId: {
            userId: context.user.id,
            messageId: input.messageId,
          },
        },
        create: {
          emoji: input.emoji,
          userId: context.user.id,
          messageId: input.messageId,
        },
        update: {
          emoji: input.emoji,
        },
      });
    }

    const updated = await prisma.message.findUnique({
      where: { id: input.messageId },
      select: {
        reactions: {
          orderBy: { createdAt: "asc" },
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
    });

    return {
      messageId: input.messageId,
      reactions: updated?.reactions ?? [],
    };
  });

export const listThreads = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .use(readsecurityMiddleware)
  .route({
    method: "GET",
    path: "/messages/:threadId/threads",
    summary: "List threads",
    tags: ["message"],
  })
  .input(
    z.object({
      threadId: z.string(),
    })
  )
  .output(
    z.object({
      parent: messageListItemSchema,
      threads: z.array(messageListItemSchema),
    })
  )
  .handler(async ({ errors, input, context }) => {
    const parent = await prisma.message.findFirst({
      where: {
        id: input.threadId,
        ...organizationScopeWhere(context.organization.id),
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        _count: { select: { replies: true } },
        reactions: {
          orderBy: { createdAt: "asc" },
          select: {
            emoji: true,
            userId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        mentions: {
          select: {
            userId: true,
          },
        },
        // Fetch replies in the same query, ordered oldest-first for thread display
        replies: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            content: true,
            imageUrl: true,
            createdAt: true,
            _count: { select: { replies: true } },
            reactions: {
              orderBy: { createdAt: "asc" },
              select: {
                emoji: true,
                userId: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            mentions: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw errors.NOT_FOUND();
    }

    // Destructure replies out so parent shape matches the output schema
    const { replies, _count, reactions, mentions, ...parentFields } = parent;

    return {
      parent: {
        ...parentFields,
        repliesCount: _count.replies,
        reactions: groupReactions(reactions, context.user.id),
        mentionedUserIds: mentions.map((m) => m.userId),
      },
      threads: replies.map(
        ({ _count, reactions, mentions: threadMentions, ...thread }) => ({
          ...thread,
          repliesCount: _count.replies,
          reactions: groupReactions(reactions, context.user.id),
          mentionedUserIds: threadMentions.map((m) => m.userId),
        })
      ),
    };
  });
