import z from "zod";
import {
  CHANNEL_SORT_FIELDS,
  type ChannelSortField,
} from "@/app/(organization)/organizations/[organizationId]/constants";
import { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  SORT_ORDERS,
  type SortOrder,
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

type ChannelListRow = Prisma.ChannelGetPayload<{
  select: typeof channelListSelect;
}>;

function toChannelOrderBy(
  sortBy: ChannelSortField,
  sortOrder: SortOrder
): Prisma.ChannelOrderByWithRelationInput {
  switch (sortBy) {
    case "createdAt":
      return { createdAt: sortOrder };
    case "totalMessages":
      return { messages: { _count: sortOrder } };
    default:
      return { name: sortOrder };
  }
}

function toChannelList(rows: ChannelListRow[]) {
  return rows.map(({ _count, ...channel }) => ({
    ...channel,
    totalMessages: _count.messages,
  }));
}

function isPrismaError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

type ErrorHelpers = {
  FORBIDDEN: (options: { message: string }) => Error;
  BAD_REQUEST: (options: { message: string }) => Error;
};

function assertCanManageChannels(role: string, errors: ErrorHelpers) {
  if (!["owner", "admin"].includes(role)) {
    throw errors.FORBIDDEN({
      message: "Only admins and owners can manage channels",
    });
  }
}

function assertActiveOrganization(
  inputOrganizationId: string,
  activeOrganizationId: string,
  errors: ErrorHelpers
) {
  if (inputOrganizationId !== activeOrganizationId) {
    throw errors.BAD_REQUEST({ message: "You recently switched organization" });
  }
}

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
    assertActiveOrganization(
      input.organizationId,
      context.organization.id,
      errors
    );

    const search = input.search?.trim();
    const where: Prisma.ChannelWhereInput = {
      organizationId: context.organization.id,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };
    const orderBy = toChannelOrderBy(
      input.sortBy ?? "createdAt",
      input.sortOrder ?? "desc"
    );

    try {
      if (input.page === undefined && input.perPage === undefined) {
        const rows = await prisma.channel.findMany({
          where,
          orderBy,
          select: channelListSelect,
        });

        return {
          channels: toChannelList(rows),
          total: rows.length,
          page: DEFAULT_PAGE,
          perPage: rows.length,
          pageCount: 1,
        };
      }

      const perPage = input.perPage ?? DEFAULT_PER_PAGE;
      const total = await prisma.channel.count({ where });
      const pageCount = Math.max(Math.ceil(total / perPage), 1);
      const page = clampPage(input.page ?? DEFAULT_PAGE, pageCount);
      const rows = await prisma.channel.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        select: channelListSelect,
      });

      return {
        channels: toChannelList(rows),
        total,
        page,
        perPage,
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
    assertCanManageChannels(context.member.role, errors);
    assertActiveOrganization(
      input.organizationId,
      context.organization.id,
      errors
    );

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
      if (isPrismaError(error, "P2002")) {
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
    assertCanManageChannels(context.member.role, errors);

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
      if (isPrismaError(error, "P2002")) {
        throw errors.BAD_REQUEST({
          message: "A channel with this name already exists",
        });
      }

      if (isPrismaError(error, "P2025")) {
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
    assertCanManageChannels(context.member.role, errors);

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
      if (isPrismaError(error, "P2025")) {
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
