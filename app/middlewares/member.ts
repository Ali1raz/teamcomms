import type { FullOrg, User } from "@/lib/auth";
import { base } from "./bast";

export const requireMemberMiddleware = base
  .$context<{
    organization: FullOrg;
    user: User;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const member = context.organization.members.find(
      (m) => m.userId === context.user.id
    );
    if (!member) {
      throw errors.FORBIDDEN();
    }
    return next({
      context: { member },
    });
  });
