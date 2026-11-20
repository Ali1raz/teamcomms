import type { FullOrg, User } from "@/lib/auth";
import { isManagerRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
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

async function isTeamMember(teamId: string, userId: string) {
  const row = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { id: true },
  });

  return Boolean(row);
}
