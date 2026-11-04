import type { FullOrg, User } from "@/lib/auth";
import { isManagerRole } from "@/lib/permissions";
import { isTeamMember } from "@/lib/teams";
import { base } from "./bast";

export const requireTeamAccessMiddleware = base
  .$context<{
    organization: FullOrg;
    user: User;
    member: { role: string };
  }>()
  .middleware(async ({ context, next, errors }, teamId: string | null) => {
    if (!teamId || isManagerRole(context.member.role)) {
      return next();
    }

    if (!(await isTeamMember(teamId, context.user.id))) {
      throw errors.FORBIDDEN({
        message: "You are not a member of this team",
      });
    }

    return next();
  });
