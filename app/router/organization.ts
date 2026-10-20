import { headers } from "next/headers";
import z from "zod";
import {
  MEMBER_SORT_FIELDS,
  type MemberSortField,
} from "@/app/(organization)/organizations/[organizationId]/constants";
import {
  INVITATION_SORT_FIELDS,
  INVITATION_STATUSES,
  type InvitationSortField,
  toMembershipRole,
} from "@/app/(organization)/organizations/[organizationId]/invitations/constants";
import { type Prisma } from "@/generated/prisma/client";
import { MembershipRole } from "@/generated/prisma/enums";
import {
  DEFAULT_PAGE,
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  SORT_ORDERS,
  type SortOrder,
} from "@/lib/app/constants";
import { auth, type FullOrg, type User } from "@/lib/auth";
import { errorMessage } from "@/lib/error-message";
import { clampPage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { createSlug } from "@/lib/utils";
import { createOrganizationSchema } from "../(organization)/organizations/schema";
import { heavyWritesecurityMiddleware } from "../middlewares/arcjet/heavy-write-middleware";
import { standardsecurityMiddleware } from "../middlewares/arcjet/standard";
import { writesecurityMiddleware } from "../middlewares/arcjet/write";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";
import { requireMemberMiddleware } from "../middlewares/member";
import { requireOrganizationMiddleware } from "../middlewares/organization";

export const listOrganizations = base
  .use(requireAuthMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "GET",
    path: "/organization",
    summary: "List all organizations",
    tags: ["Organization"],
  })
  .input(z.void())
  .output(
    z.object({
      organizations: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          logo: z.string().nullable().optional(),
          role: z.enum([...Object.values(MembershipRole)]),
          totalMembers: z.number(),
          totalTeams: z.number(),
        })
      ),
      user: z.custom<User>(),
      currentOrganization: z.custom<FullOrg | null>(),
    })
  )
  .handler(async ({ context }) => {
    const [data, currentOrganization, memberRoles, counts] = await Promise.all([
      auth.api.listOrganizations({ headers: await headers() }),
      auth.api.getFullOrganization({ headers: await headers() }),
      prisma.member.findMany({
        where: { userId: context.user.id },
        select: { organizationId: true, role: true },
      }),
      prisma.organization.findMany({
        where: {
          members: { some: { userId: context.user.id } },
        },
        select: {
          id: true,
          _count: {
            select: {
              members: true,
              teams: true,
            },
          },
        },
      }),
    ]);

    const countMap = new Map(counts.map((o) => [o.id, o._count]));
    const roleMap = new Map(memberRoles.map((m) => [m.organizationId, m.role]));

    return {
      organizations: data.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        role: roleMap.get(org.id) ?? "member",
        totalMembers: countMap.get(org.id)?.members ?? 0,
        totalTeams: countMap.get(org.id)?.teams ?? 0,
      })),
      user: context.user,
      currentOrganization: currentOrganization,
    };
  });

export const createOrganization = base
  .use(requireAuthMiddleware)
  .use(standardsecurityMiddleware)
  .use(heavyWritesecurityMiddleware)
  .route({
    method: "POST",
    path: "/organization",
    summary: "Create a new organization",
    tags: ["Organization"],
  })
  .input(createOrganizationSchema)
  .output(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      createdAt: z.string(),
      logo: z.string().nullable().optional(),
    })
  )
  .handler(async ({ context, input, errors }) => {
    const slug = createSlug(input.name);
    console.log("Creating organization with slug:", slug);

    let data: Awaited<ReturnType<typeof auth.api.createOrganization>>;

    try {
      data = await auth.api.createOrganization({
        body: {
          name: input.name,
          slug: slug,
          userId: context.user.id,
          keepCurrentActiveOrganization: false,
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to create organization"),
      });
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      createdAt: data.createdAt.toISOString(),
      logo: data.logo,
    };
  });

export const updateOrganization = base
  .use(requireAuthMiddleware)
  .use(standardsecurityMiddleware)
  .use(heavyWritesecurityMiddleware)
  .route({
    method: "POST",
    path: "/organization/update",
    summary: "Update a organization",
    tags: ["Organization"],
  })
  .input(
    z.object({
      organizationId: z.string(),
      name: z.string().trim().min(1, "Organization name is required"),
      logo: z.string().nullable().optional(),
    })
  )
  .output(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      logo: z.string().nullable().optional(),
    })
  )
  .handler(async ({ input, errors }) => {
    const slug = createSlug(input.name);

    let data: Awaited<ReturnType<typeof auth.api.updateOrganization>>;
    try {
      data = await auth.api.updateOrganization({
        body: {
          data: {
            name: input.name,
            slug,
            logo: input.logo ?? undefined,
          },
          organizationId: input.organizationId,
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to update organization"),
      });
    }

    if (!data) {
      throw errors.NOT_FOUND({
        message: "Organization not found",
      });
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      logo: data.logo,
    };
  });

export const listOrganizationMembers = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "GET",
    path: "/organization/:organizationId/members",
    summary: "List all members of a organization",
    tags: ["Organization"],
  })
  .input(
    z.object({
      organizationId: z.string(),
      page: z.number().int().min(1).optional(),
      perPage: z.number().int().min(1).max(MAX_PER_PAGE).optional(),
      search: z.string().optional(),
      role: z.enum([...Object.values(MembershipRole)]).optional(),
      sortBy: z.enum([...MEMBER_SORT_FIELDS]).optional(),
      sortOrder: z.enum([...SORT_ORDERS]).optional(),
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
    const where: Prisma.MemberWhereInput = {
      organizationId: input.organizationId,
      ...(input.role ? { role: input.role } : {}),
      ...(search
        ? {
            OR: [
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const orderBy = toMemberOrderBy(
      input.sortBy ?? "name",
      input.sortOrder ?? "asc"
    );
    const select = {
      role: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    } as const;

    const toMembers = (
      rows: {
        role: MembershipRole | null;
        user: {
          id: string;
          name: string;
          email: string;
          image: string | null;
        };
      }[]
    ) =>
      rows.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image ?? null,
        role: member.role ?? "member",
      }));

    try {
      if (input.page === undefined && input.perPage === undefined) {
        const rows = await prisma.member.findMany({ where, orderBy, select });

        return {
          members: toMembers(rows),
          total: rows.length,
          page: DEFAULT_PAGE,
          perPage: rows.length,
          pageCount: 1,
        };
      }

      const perPage = input.perPage ?? DEFAULT_PER_PAGE;
      const total = await prisma.member.count({ where });
      const pageCount = Math.max(Math.ceil(total / perPage), 1);
      const page = clampPage(input.page ?? DEFAULT_PAGE, pageCount);
      const rows = await prisma.member.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        select,
      });

      return {
        members: toMembers(rows),
        total,
        page,
        perPage,
        pageCount,
      };
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to list organization members"),
      });
    }
  });

export const updateOrganizationMemberRole = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "POST",
    path: "/organization/members/update-role",
    summary: "Update a member's role in the organization",
    tags: ["organization"],
  })
  .input(
    z.object({
      userId: z.string(),
      role: z.enum([...Object.values(MembershipRole)]),
      organizationId: z.string().optional(),
    })
  )
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners can update member roles",
      });
    }

    const orgId = input.organizationId ?? context.organization.id;

    const member = await prisma.member.findFirst({
      where: {
        userId: input.userId,
        organizationId: orgId,
      },
      select: { id: true },
    });

    if (!member) {
      throw errors.NOT_FOUND({
        message: "Member not found in this organization",
      });
    }

    try {
      await auth.api.updateMemberRole({
        body: {
          memberId: member.id,
          role: input.role,
          organizationId: orgId,
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to update member role"),
      });
    }
  });

function toMemberOrderBy(
  sortBy: MemberSortField,
  sortOrder: SortOrder
): Prisma.MemberOrderByWithRelationInput {
  switch (sortBy) {
    case "email":
      return { user: { email: sortOrder } };
    case "role":
      return { role: sortOrder };
    default:
      return { user: { name: sortOrder } };
  }
}

function toInvitationOrderBy(
  sortBy: InvitationSortField,
  sortOrder: SortOrder
): Prisma.InvitationOrderByWithRelationInput {
  switch (sortBy) {
    case "email":
      return { email: sortOrder };
    case "role":
      return { role: sortOrder };
    case "status":
      return { status: sortOrder };
    case "expiresAt":
      return { expiresAt: sortOrder };
    default:
      return { createdAt: sortOrder };
  }
}

export const listOrganizationInvitations = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "GET",
    path: "/organization/:organizationId/invitations",
    summary: "List all invitations for a organization",
    tags: ["Organization"],
  })
  .input(
    z.object({
      organizationId: z.string(),
      page: z.number().int().min(1).default(DEFAULT_PAGE),
      perPage: z
        .number()
        .int()
        .min(1)
        .max(MAX_PER_PAGE)
        .default(DEFAULT_PER_PAGE),
      search: z.string().optional(),
      status: z.enum([...INVITATION_STATUSES]).optional(),
      role: z.enum([...Object.values(MembershipRole)]).optional(),
      sortBy: z.enum([...INVITATION_SORT_FIELDS]).default("createdAt"),
      sortOrder: z.enum([...SORT_ORDERS]).default("desc"),
    })
  )
  .output(
    z.object({
      invitations: z.array(
        z.object({
          id: z.string(),
          organizationId: z.string(),
          email: z.string(),
          role: z.enum(MembershipRole).nullish(),
          status: z.string(),
          expiresAt: z.coerce.date(),
          createdAt: z.coerce.date(),
          inviter: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            image: z.string().nullable(),
          }),
          invitedUser: z
            .object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              image: z.string().nullable(),
            })
            .nullable(),
          team: z
            .object({
              id: z.string(),
              name: z.string(),
              slug: z.string(),
            })
            .nullable(),
        })
      ),
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

    const where: Prisma.InvitationWhereInput = {
      organizationId: context.organization.id,
      ...(input.status ? { status: input.status } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const page = await (async () => {
      try {
        const total = await prisma.invitation.count({ where });
        const pageCount = Math.max(Math.ceil(total / input.perPage), 1);
        const safePage = clampPage(input.page, pageCount);

        const rows = await prisma.invitation.findMany({
          where,
          orderBy: toInvitationOrderBy(input.sortBy, input.sortOrder),
          skip: (safePage - 1) * input.perPage,
          take: input.perPage,
          select: {
            id: true,
            organizationId: true,
            email: true,
            role: true,
            status: true,
            expiresAt: true,
            createdAt: true,
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
            team: { select: { id: true, name: true, slug: true } },
          },
        });

        const emails = rows.map((row) => row.email);
        const invitedUsers = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: { id: true, name: true, email: true, image: true },
        });
        const invitedUserMap = new Map(
          invitedUsers.map((user) => [user.email, user])
        );

        return {
          total,
          pageCount,
          page: safePage,
          rows: rows.map((invitation) => ({
            id: invitation.id,
            organizationId: invitation.organizationId,
            email: invitation.email,
            role: toMembershipRole(invitation.role),
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
            inviter: invitation.user,
            invitedUser: invitedUserMap.get(invitation.email) ?? null,
            team: invitation.team,
          })),
        };
      } catch (error: unknown) {
        throw errors.INTERNAL_SERVER_ERROR({
          message: errorMessage(error, "Failed to list invitations"),
        });
      }
    })();

    return {
      invitations: page.rows,
      total: page.total,
      page: page.page,
      perPage: input.perPage,
      pageCount: page.pageCount,
    };
  });

export const cancelOrganizationInvitation = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "POST",
    path: "/organization/invitations/cancel",
    summary: "Cancel a organization invitation",
    tags: ["Organization"],
  })
  .input(
    z.object({
      invitationId: z.string(),
      organizationId: z.string(),
    })
  )
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    if (input.organizationId !== context.organization.id) {
      throw errors.BAD_REQUEST({
        message: "You recently switched organization",
      });
    }

    try {
      await auth.api.cancelInvitation({
        body: {
          invitationId: input.invitationId,
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: errorMessage(error, "Failed to cancel invitation"),
      });
    }
  });

export const removeOrganizationMember = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(writesecurityMiddleware)
  .route({
    method: "POST",
    path: "/organization/members/remove",
    summary: "Remove a member from the organization",
    tags: ["organization"],
  })
  .input(
    z.object({
      userId: z.string(),
      organizationId: z.string().optional(),
    })
  )
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    if (!["owner", "admin"].includes(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only admins and owners can remove members",
      });
    }

    const orgId = input.organizationId ?? context.organization.id;

    const member = await prisma.member.findFirst({
      where: {
        userId: input.userId,
        organizationId: orgId,
      },
      select: { id: true, role: true },
    });

    if (!member) {
      throw errors.NOT_FOUND({
        message: "Member not found in this organization",
      });
    }

    if (member.role === "owner") {
      throw errors.BAD_REQUEST({
        message: "Cannot remove the owner of the organization",
      });
    }

    try {
      await auth.api.removeMember({
        body: {
          memberIdOrEmail: member.id,
          organizationId: orgId,
        },
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to remove member"),
      });
    }
  });

export const leaveOrganization = base
  .use(requireAuthMiddleware)
  .route({
    method: "POST",
    path: "/organization/leave",
    summary: "Leave a organization",
    tags: ["Organization"],
  })
  .input(z.object({ organizationId: z.string() }))
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    const { user } = context;
    const { organizationId } = input;

    // better-auth throws if sole owner
    try {
      await auth.api.leaveOrganization({
        body: { organizationId },
        headers: await headers(),
      });
    } catch (error: unknown) {
      throw errors.BAD_REQUEST({
        message: errorMessage(error, "Failed to leave organization"),
      });
    }

    // No hook fires on leave, so clean up teamMember records manually
    await prisma.teamMember.deleteMany({
      where: {
        userId: user.id,
        team: { organizationId },
      },
    });

    console.log("Left organization", organizationId);
  });
