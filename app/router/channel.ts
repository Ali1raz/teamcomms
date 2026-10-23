import z from "zod";
import { CHANNEL_SORT_FIELDS } from "@/app/(organization)/organizations/[organizationId]/constants";
import { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  SORT_ORDERS,
} from "@/lib/app/constants";
import { errorMessage } from "@/lib/error-message";
import { clampPage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { createSlug } from "@/lib/utils";
import {
  createChannelSchema,
  updateChannelSchema,
} from "../(organization)/organizations/schema";
import { readsecurityMiddleware } from "../middlewares/arcjet/read";
import { standardsecurityMiddleware } from "../middlewares/arcjet/standard";
import { writesecurityMiddleware } from "../middlewares/arcjet/write";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";
import { requireMemberMiddleware } from "../middlewares/member";
import { requireOrganizationMiddleware } from "../middlewares/organization";

const channelSelect = {
  id: true,
  name: true,
  slug: true,
  organizationId: true,
} as const;

const channelListSelect = {
  ...channelSelect,
  createdAt: true,
  _count: { select: { messages: true } },
} as const;

const channelOutput = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  organizationId: z.string(),
});

const channelListOutput = channelOutput.extend({
  createdAt: z.date(),
  totalMessages: z.number(),
});

export const listChannels = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(readsecurityMiddleware)
  .route({
    method: "GET",
    path: "/channel",
    summary: "List channels",
    tags: ["channel"],
  })
  .input(
    z.object({
      organizationId: z.string(),
      page: z.number().int().min(1).optional(),
      perPage: z.number().int().min(1).max(MAX_PER_PAGE).optional(),
      search: z.string().optional(),
      sortBy: z.enum([...CHANNEL_SORT_FIELDS]).optional(),
      sortOrder: z.enum([...SORT_ORDERS]).optional(),
    })
  )
  .output(
    z.object({
      channels: z.array(channelListOutput),
      total: z.number(),
      page: z.number(),
      perPage: z.number(),
      pageCount: z.number(),
    })
  )
  .handler(async ({ context, input, errors }) => {
    if (input.organizationId !== context.organization.id) {
      throw errors.BAD_REQUEST({
        message: "You recently switched organization",
      });
    }

    const search = input.search?.trim();
    const where: Prisma.ChannelWhereInput = {
      organizationId: context.organization.id,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };
    const sortOrder = input.sortOrder ?? "desc";
    const sortBy = input.sortBy ?? "createdAt";
    const orderBy: Prisma.ChannelOrderByWithRelationInput =
      sortBy === "createdAt"
        ? { createdAt: sortOrder }
        : sortBy === "totalMessages"
          ? { messages: { _count: sortOrder } }
          : { name: sortOrder };

    try {
      const paginate = input.page !== undefined || input.perPage !== undefined;
      const perPage = paginate
        ? (input.perPage ?? DEFAULT_PER_PAGE)
        : undefined;
      const total = paginate
        ? await prisma.channel.count({ where })
        : undefined;
      const pageCount =
        total !== undefined && perPage !== undefined
          ? Math.max(Math.ceil(total / perPage), 1)
          : 1;
      const page =
        perPage !== undefined
          ? clampPage(input.page ?? DEFAULT_PAGE, pageCount)
          : DEFAULT_PAGE;
      const rows = await prisma.channel.findMany({
        where,
        orderBy,
        select: channelListSelect,
        ...(perPage !== undefined
          ? { skip: (page - 1) * perPage, take: perPage }
          : {}),
      });

      return {
        channels: rows.map(({ _count, ...channel }) => ({
          ...channel,
          totalMessages: _count.messages,
        })),
        total: total ?? rows.length,
        page,
        perPage: perPage ?? rows.length,
        pageCount,
      };
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to list channels"),
      });
    }
  });

export const getChannel = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(readsecurityMiddleware)
  .route({
    method: "GET",
    path: "/channel/:channelId",
    summary: "Get a channel",
    tags: ["channel"],
  })
  .input(z.object({ channelId: z.string() }))
  .output(z.object({ channel: channelOutput }))
  .handler(async ({ context, input, errors }) => {
    const channel = await prisma.channel.findFirst({
      where: {
        id: input.channelId,
        organizationId: context.organization.id,
      },
      select: channelSelect,
    });

    if (!channel) {
      throw errors.NOT_FOUND({ message: "Channel not found" });
    }

    return { channel };
  });

export const createChannel = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "POST",
    path: "/channel",
    summary: "Create a channel",
    tags: ["channel"],
  })
  .input(createChannelSchema)
  .output(z.object({ channel: channelOutput }))
  .handler(async ({ context, input, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners can manage channels",
      });
    }

    if (input.organizationId !== context.organization.id) {
      throw errors.BAD_REQUEST({
        message: "You recently switched organization",
      });
    }

    try {
      const channel = await prisma.channel.create({
        data: {
          name: input.name,
          slug: createSlug(input.name),
          organizationId: context.organization.id,
        },
        select: channelSelect,
      });

      return { channel };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw errors.BAD_REQUEST({
          message: "A channel with this name already exists",
        });
      }

      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to create channel"),
      });
    }
  });

export const updateChannel = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "PUT",
    path: "/channel/:channelId",
    summary: "Update a channel",
    tags: ["channel"],
  })
  .input(updateChannelSchema)
  .output(z.object({ channel: channelOutput }))
  .handler(async ({ context, input, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners can manage channels",
      });
    }

    const existingChannel = await prisma.channel.findFirst({
      where: {
        id: input.channelId,
        organizationId: context.organization.id,
      },
      select: { id: true },
    });

    if (!existingChannel) {
      throw errors.NOT_FOUND({ message: "Channel not found" });
    }

    try {
      const channel = await prisma.channel.update({
        where: { id: existingChannel.id },
        data: {
          name: input.name,
          slug: createSlug(input.name),
        },
        select: channelSelect,
      });

      return { channel };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw errors.BAD_REQUEST({
          message: "A channel with this name already exists",
        });
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw errors.NOT_FOUND({ message: "Channel not found" });
      }

      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to update channel"),
      });
    }
  });

export const deleteChannel = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "DELETE",
    path: "/channel/:channelId",
    summary: "Delete a channel",
    tags: ["channel"],
  })
  .input(z.object({ channelId: z.string() }))
  .output(
    z.object({
      id: z.string(),
      organizationId: z.string(),
    })
  )
  .handler(async ({ context, input, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners can manage channels",
      });
    }

    const existingChannel = await prisma.channel.findFirst({
      where: {
        id: input.channelId,
        organizationId: context.organization.id,
      },
      select: { id: true, organizationId: true },
    });

    if (!existingChannel) {
      throw errors.NOT_FOUND({ message: "Channel not found" });
    }

    try {
      await prisma.channel.delete({ where: { id: existingChannel.id } });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw errors.NOT_FOUND({ message: "Channel not found" });
      }

      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to delete channel"),
      });
    }

    return {
      id: existingChannel.id,
      organizationId: existingChannel.organizationId,
    };
  });
