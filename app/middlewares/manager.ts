import type { MembershipRole } from "@/generated/prisma/enums";
import { isManagerRole } from "@/lib/permissions";
import { base } from "./bast";

export const requireManagerMiddleware = base
  .$context<{ member: { role: MembershipRole | string } }>()
  .middleware(async ({ context, next, errors }) => {
    if (!isManagerRole(context.member.role)) {
      throw errors.FORBIDDEN({
        message: "Only owners and admins can perform this action",
      });
    }
    return next();
  });
