import { headers } from "next/headers";
import z from "zod";
import { MembershipRole } from "@/generated/prisma/enums";
import { auth, type User } from "@/lib/auth";
import { errorMessage } from "@/lib/error-message";
import { prisma } from "@/lib/prisma";
import { updateTeamSchema } from "@/lib/schema";
import { createSlug } from "@/lib/utils";
import { createTeamSchema } from "../(organization)/organizations/schema";
import { heavyWritesecurityMiddleware } from "../middlewares/arcjet/heavy-write-middleware";
import { readsecurityMiddleware } from "../middlewares/arcjet/read";
import { standardsecurityMiddleware } from "../middlewares/arcjet/standard";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";
import { requireMemberMiddleware } from "../middlewares/member";
import { requireOrganizationMiddleware } from "../middlewares/organization";

export const createTeam = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(heavyWritesecurityMiddleware)
  .route({
    method: "POST",
    path: "/team",
    summary: "create new team",
    tags: ["team"],
  })
  .input(createTeamSchema)
  .output(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      organizationId: z.string(),
      createdAt: z.date(),
      updatedAt: z.date().nullable().optional(),
    })
  )
  .handler(async ({ context, input, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners in this organization can create teams",
      });
    }

    const slug = createSlug(input.name);
    let data: Awaited<ReturnType<typeof auth.api.createTeam>>;
    try {
      data = await auth.api.createTeam({
        body: {
          name: input.name,
          slug,
          organizationId: context.organization.id,
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to create team"),
      });
    }

    return { ...data, updatedAt: data.updatedAt ?? null };
  });

export const updateTeam = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(heavyWritesecurityMiddleware)
  .route({
    method: "PUT",
    path: "/team/:teamId",
    summary: "update team",
    tags: ["team"],
  })
  .input(updateTeamSchema)
  .output(
    z.object({
      name: z.string(),
      organizationId: z.string(),
    })
  )
  .handler(async ({ context, input, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners can update team",
      });
    }

    const slug = createSlug(input.name);
    let data: Awaited<ReturnType<typeof auth.api.updateTeam>>;
    try {
      data = await auth.api.updateTeam({
        body: {
          teamId: input.teamId,
          data: {
            name: input.name,
            slug,
            organizationId: context.organization.id,
          },
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to update team"),
      });
    }

    if (!data) {
      throw errors.NOT_FOUND({ message: "Team not found" });
    }

    return { name: data.name, organizationId: data.organizationId };
  });

export const listTeams = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .route({
    method: "GET",
    path: "/team",
    summary: "List all teams",
    tags: ["team"],
  })
  .input(
    z.object({
      organizationId: z.string(),
    })
  )
  .output(
    z.object({
      teams: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          createdAt: z.date(),
          updatedAt: z.date().nullable().optional(),
          totalMembers: z.number(),
        })
      ),
    })
  )
  .handler(async ({ context, input }) => {
    const teams = await prisma.team.findMany({
      where: {
        organizationId: input.organizationId,
        teammembers: {
          some: {
            userId: context.user.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // newest teams first
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { teammembers: true, messages: true },
        },
      },
    });

    return {
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        slug: team.slug,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        totalMembers: team._count.teammembers ?? 0,
      })),
    };
  });

export const getTeam = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(readsecurityMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "GET",
    path: "/team/:teamId",
    summary: "Get a team",
    tags: ["team"],
  })
  .input(
    z.object({
      teamId: z.string(),
    })
  )
  .output(
    z.object({
      team: z.string(),
      currentUser: z.custom<User>(),
    })
  )
  .handler(async ({ input, context, errors }) => {
    console.log("[team.get]: called for", input.teamId);
    const team = await prisma.team.findUnique({
      where: { id: input.teamId },
      select: {
        name: true,
      },
    });

    if (!team) {
      throw errors.NOT_FOUND({ message: "Team not found" });
    }

    return {
      team: team.name,
      currentUser: context.user,
    };
  });

export const deleteTeam = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "DELETE",
    path: "/team/:teamId",
    summary: "Delete a team",
    tags: ["team"],
  })
  .input(
    z.object({
      teamId: z.string(),
    })
  )
  .output(
    z.object({
      organizationId: z.string(),
    })
  )
  .handler(async ({ input, context, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners can delete teams",
      });
    }

    try {
      await auth.api.removeTeam({
        body: {
          teamId: input.teamId,
          organizationId: context.organization.id,
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      console.log(error);
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to delete team"),
      });
    }

    return {
      organizationId: context.organization.id,
    };
  });

export const addMembersToTeam = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "POST",
    path: "/team/:teamId/add-members",
    summary: "Add members to a team",
    tags: ["team"],
  })
  .input(
    z.object({
      teamId: z.string(),
      memberIds: z.array(z.string()),
    })
  )
  .output(z.void())
  .handler(async ({ input, context, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners can add members to a team",
      });
    }
    try {
      await Promise.all(
        input.memberIds.map(async (userId) => {
          return auth.api.addTeamMember({
            body: { teamId: input.teamId, userId },
            headers: await headers(),
          });
        })
      );
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to add members to team"),
      });
    }
  });

export const removeMemberFromTeam = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "POST",
    path: "/team/:teamId/remove-member",
    summary: "Remove member from a team",
    tags: ["team"],
  })
  .input(
    z.object({
      teamId: z.string(),
      memberId: z.string(),
    })
  )
  .output(z.void())
  .handler(async ({ input, context, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners can remove members from a team",
      });
    }
    try {
      await auth.api.removeTeamMember({
        body: { teamId: input.teamId, userId: input.memberId },
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to remove member from team"),
      });
    }
  });

export const listTeamMembers = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "GET",
    path: "/team/:teamId/members",
    summary: "List members of a team",
    tags: ["team"],
  })
  .input(
    z.object({
      teamId: z.string(),
    })
  )
  .output(
    z.object({
      members: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          image: z.string().nullable(),
          role: z.enum([...Object.values(MembershipRole)]),
        })
      ),
    })
  )
  .handler(async ({ context, input, errors }) => {
    let rawMembers;
    try {
      rawMembers = await prisma.teamMember.findMany({
        where: { teamId: input.teamId },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              members: {
                where: { organizationId: context.organization.id },
                select: { role: true },
                take: 1,
              },
            },
          },
        },
      });
    } catch (error) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to list team members"),
      });
    }

    const members = rawMembers.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image ?? null,
      role: m.user.members?.[0]?.role ?? "member",
    }));

    return { members };
  });
