import { headers } from "next/headers";
import z from "zod/v3";
import { auth } from "@/lib/auth";
import { errorMessage } from "@/lib/error-message";
import { prisma } from "@/lib/prisma";
import { inviteMemberSchema } from "../(organization)/organizations/schema";
import { heavyWritesecurityMiddleware } from "../middlewares/arcjet/heavy-write-middleware";
import { standardsecurityMiddleware } from "../middlewares/arcjet/standard";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";
import { requireManagerMiddleware } from "../middlewares/manager";
import { requireMemberMiddleware } from "../middlewares/member";
import {
  requireActiveOrganizationMiddleware,
  requireOrganizationMiddleware,
} from "../middlewares/organization";

export const inviteMember = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(requireMemberMiddleware)
  .use(standardsecurityMiddleware)
  .use(heavyWritesecurityMiddleware)
  .route({
    method: "POST",
    path: "/organization/members/invite",
    summary: "Invite members to the organization",
    tags: ["members"],
  })
  .input(inviteMemberSchema)
  .use(requireActiveOrganizationMiddleware, (input) => input.organizationId)
  .use(requireManagerMiddleware)
  .output(z.void())
  .handler(async ({ context, input, errors }) => {
    if (input.teamId) {
      const team = await prisma.team.findFirst({
        where: {
          id: input.teamId,
          organizationId: context.organization.id,
        },
        select: { id: true },
      });

      if (!team) {
        throw errors.BAD_REQUEST({
          message: "Team not found in this organization",
        });
      }
    }

    try {
      await auth.api.createInvitation({
        body: {
          email: input.email,
          role: input.role,
          organizationId: context.organization.id,
          resend: input.resend,
          teamId: input.teamId ?? undefined,
        },
        headers: await headers(),
      });
    } catch (error) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: errorMessage(error, "Failed to create invite"),
      });
    }
  });
