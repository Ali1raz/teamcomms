import { headers } from "next/headers";
import z from "zod";
import { type Prisma } from "@/generated/prisma/client";
import { MembershipRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { errorMessage } from "@/lib/error-message";
import { prisma } from "@/lib/prisma";
import { standardsecurityMiddleware } from "../middlewares/arcjet/standard";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";
import { requireOrganizationMiddleware } from "../middlewares/organization";

export const getCurrentUser = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .route({
    method: "GET",
    path: "/user/get",
    summary: "Get the current user",
    tags: ["User"],
  })
  .input(z.void())
  .output(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      image: z.string().nullable(),
      role: z.enum([...Object.values(MembershipRole)]),
    })
  )
  .handler(async ({ errors }) => {
    let member: Awaited<ReturnType<typeof auth.api.getActiveMember>>;
    try {
      member = await auth.api.getActiveMember({
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to get user"),
      });
    }
    if (!member) {
      throw errors.FORBIDDEN({ message: "No active member found" });
    }
    const resUser = {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image || null,
      role: member.role ?? "member",
    };

    return resUser;
  });

export const listMentionUsers = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "GET",
    path: "/user/mention",
    summary: "List users available to mention",
    tags: ["User"],
  })
  .input(
    z.object({
      // When set, only members of this team are mentionable. Otherwise all
      // members of the current organization are mentionable.
      teamId: z.string().optional(),
    })
  )
  .output(
    z.object({
      users: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          image: z.string().nullable(),
        })
      ),
    })
  )
  .handler(async ({ context, input, errors }) => {
    const currentUserId = context.user.id;
    const organizationId = context.organization.id;

    let userRows;

    if (input.teamId) {
      const team = await prisma.team.findFirst({
        where: { id: input.teamId, organizationId },
        select: { id: true },
      });
      if (!team) {
        throw errors.NOT_FOUND({ message: "Team not found" });
      }

      try {
        const rows = await prisma.teamMember.findMany({
          where: { teamId: input.teamId },
          select: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        });
        userRows = rows.map((row) => row.user);
      } catch (error: unknown) {
        throw errors.BAD_REQUEST({
          message: errorMessage(error, "Failed to list team members"),
        });
      }
    } else {
      try {
        const rows = await prisma.member.findMany({
          where: { organizationId },
          select: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        });
        userRows = rows.map((row) => row.user);
      } catch (error: unknown) {
        throw errors.BAD_REQUEST({
          message: errorMessage(error, "Failed to list organization members"),
        });
      }
    }

    // Never include the current user in the mention list.
    return {
      users: userRows
        .filter((user) => user.id !== currentUserId)
        .map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? null,
        })),
    };
  });
