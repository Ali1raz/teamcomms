import { headers } from "next/headers";
import z from "zod/v3";
import { auth } from "@/lib/auth";
import { errorMessage } from "@/lib/error-message";
import { inviteMemberSchema } from "../(organization)/organizations/schema";
import { heavyWritesecurityMiddleware } from "../middlewares/arcjet/heavy-write-middleware";
import { standardsecurityMiddleware } from "../middlewares/arcjet/standard";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";
import { requireOrganizationMiddleware } from "../middlewares/organization";

export const inviteMember = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(standardsecurityMiddleware)
  .use(heavyWritesecurityMiddleware)
  .route({
    method: "POST",
    path: "/organization/members/invite",
    summary: "Invite members to the organization",
    tags: ["members"],
  })
  .input(inviteMemberSchema)
  .output(z.void())
  .handler(async ({ input, errors }) => {
    console.log("[inviteMember]:", { input });

    try {
      await auth.api.createInvitation({
        body: {
          email: input.email,
          role: input.role,
          organizationId: input.organizationId,
          resend: input.resend,
          teamId: input.teamId ?? undefined,
        },
        headers: await headers(),
      });
    } catch (error) {
      console.log(error);
      throw errors.INTERNAL_SERVER_ERROR({
        message: errorMessage(error, "Failed to create invite"),
      });
    }
  });
