import { headers } from "next/headers";
import z from "zod";
import { MembershipRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { errorMessage } from "@/lib/error-message";
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
