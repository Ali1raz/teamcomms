import { headers } from "next/headers";
import z from "zod/v3";
import { auth } from "@/lib/auth";
import { errorMessage } from "@/lib/error-message";
import { standardsecurityMiddleware } from "../middlewares/arcjet/standard";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";

export const getInvitionDEtails = base
  .use(requireAuthMiddleware)
  .use(standardsecurityMiddleware)
  .route({
    method: "GET",
    path: "/invitations/:invitationId",
    summary: "Get invitation details by invitation ID",
    tags: ["invitations"],
  })
  .input(
    z.object({
      invitationId: z.string(),
    })
  )
  .output(
    z.object({
      invitation: z.object({
        id: z.string(),
        organizationId: z.string(),
        organizationName: z.string(),
        organizationSlug: z.string(),
        email: z.string(),
        role: z.enum(["member", "owner", "admin"]),
        status: z.enum(["pending", "accepted", "rejected", "canceled"]),
        inviterId: z.string(),
        inviterEmail: z.string(),
        expiresAt: z.coerce.date(),
        createdAt: z.coerce.date(),
        teamId: z.string().nullish(),
      }),
    })
  )
  .handler(async ({ input, errors }) => {
    let data: Awaited<ReturnType<typeof auth.api.getInvitation>>;
    try {
      data = await auth.api.getInvitation({
        query: {
          id: input.invitationId,
        },
        headers: await headers(),
      });
    } catch (error) {
      throw errors.INTERNAL_SERVER_ERROR({
        message: errorMessage(error, "Failed to get invitation details"),
      });
    }

    return { invitation: data };
  });
