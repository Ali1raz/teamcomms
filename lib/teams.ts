import { prisma } from "@/lib/prisma";

export async function isTeamMember(teamId: string, userId: string) {
  const row = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { id: true },
  });

  return Boolean(row);
}
