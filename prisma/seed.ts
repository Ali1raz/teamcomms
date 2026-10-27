import { provisionDefaultChannels } from "@/lib/channel-provisioning";
import { prisma } from "@/lib/prisma";

async function main() {
  const organizations = await prisma.organization.findMany({
    where: { channels: { none: {} } },
    select: { id: true },
  });

  for (const organization of organizations) {
    await provisionDefaultChannels(organization.id);
  }
}

main()
  .catch((error) => {
    console.error("[seed]: failed to provision default channels", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
