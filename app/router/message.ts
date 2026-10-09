import z from "zod";
import type { Message } from "@/generated/prisma/client";
import { sensitiveInfoAj } from "@/lib/arcjet-helpers";
import { prisma } from "@/lib/prisma";
import {
  createMessageSchema,
  updateMessageSchema,
} from "../(organization)/organizations/schema";
import { readsecurityMiddleware } from "../middlewares/arcjet/read";
import { standardsecurityMiddleware } from "../middlewares/arcjet/standard";
import { writesecurityMiddleware } from "../middlewares/arcjet/write";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";
import { requireOrganizationMiddleware } from "../middlewares/organization";

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
  .output(z.custom<Message>())
  .handler(async ({ context, input, errors }) => {
    // Run the PII check here because the middleware layer cannot see parsed input.
    const sensitiveInfoDecision = await sensitiveInfoAj().protect(
      context.request,
      {
        userId: context.user.id,
        sensitiveInfoValue: input.content,
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

    if (input.threadId) {
      const prentMessage = await prisma.message.findFirst({
        where: {
          id: input.threadId,
          team: {
            organization: {
              id: context.organization.id,
            },
          },
        },
      });

      if (
        !prentMessage ||
        prentMessage.teamId !== input.teamId ||
        prentMessage.threadId !== null
      ) {
        throw errors.BAD_REQUEST();
      }
    }

    const team = await prisma.team.findFirst({
      where: {
        id: input.teamId,
        organizationId: context.organization.id,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!team) {
      throw errors.FORBIDDEN();
    }

    if (team.organizationId !== context.organization.id) {
      throw errors.FORBIDDEN();
    }

    console.log(
      "Creating message in team:",
      team.id,
      "by user:",
      context.user.name
    );

    const message = await prisma.message.create({
      data: {
        content: input.content,
        imageUrl: input.imageUrl,
        teamId: input.teamId,
        userId: context.user.id,
        threadId: input.threadId,
      },
    });

    return {
      ...message,
    };
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
  .input(
    z.object({
      teamId: z.string(),
      limit: z.number().min(1).max(100).default(30).optional(),
      cursor: z.string().optional(),
    })
  )
  .output(
    z.object({
      messages: z.array(
        z.object({
          id: z.string(),
          content: z.string(),
          imageUrl: z.string().nullable().optional(),
          createdAt: z.date(),
          _count: z.object({
            replies: z.number(),
          }),
          user: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
          }),
        })
      ),
      nextCursor: z.string().nullable(),
    })
  )
  .handler(async ({ context, errors, input }) => {
    const team = await prisma.team.findFirst({
      where: {
        id: input.teamId,
        organizationId: context.organization.id,
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      throw errors.FORBIDDEN();
    }

    const limit = input.limit;

    console.log("===\n[listMessages]:", { limit, cursor: input.cursor });

    const messages = await prisma.message.findMany({
      where: {
        teamId: team.id,
        threadId: null,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    const nextCursor =
      messages.length === limit ? messages[messages.length - 1].id : null;

    return {
      messages: messages,
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
    const sensitiveInfoDecision = await sensitiveInfoAj().protect(
      context.request,
      {
        userId: context.user.id,
        sensitiveInfoValue: input.content,
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

    const message = await prisma.message.findUnique({
      where: {
        id: input.messageId,
        team: {
          organization: { id: context.organization.id },
        },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!message) {
      throw errors.NOT_FOUND();
    }

    if (message.userId !== context.user.id) {
      throw errors.FORBIDDEN();
    }

    const updatedMessage = await prisma.message.update({
      where: {
        id: input.messageId,
      },
      data: {
        content: input.content,
        // Preserve attachment edits from the message editor instead of silently dropping them.
        imageUrl: input.imageUrl,
      },
    });

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
    console.log(`[deleteMessage]:${input.messageId}`);
    const message = await prisma.message.findUnique({
      where: {
        id: input.messageId,
        team: {
          organization: { id: context.organization.id },
        },
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
      parent: z.object({
        id: z.string(),
        content: z.string(),
        imageUrl: z.string().nullable(),
        createdAt: z.date(),
        user: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          image: z.string().nullable(),
        }),
      }),
      threads: z.array(
        z.object({
          id: z.string(),
          content: z.string(),
          imageUrl: z.string().nullable(),
          createdAt: z.date(),
          user: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
          }),
        })
      ),
    })
  )
  .handler(async ({ errors, input, context }) => {
    const parent = await prisma.message.findUnique({
      where: {
        id: input.threadId,
        team: {
          organization: { id: context.organization.id },
        },
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
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
    const { replies, ...parentFields } = parent;

    return {
      parent: parentFields,
      threads: replies,
    };
  });
