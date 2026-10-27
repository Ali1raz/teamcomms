import { DEFAULT_CHANNELS } from "@/lib/app/constants";
import { prisma } from "@/lib/prisma";
import { createSlug } from "@/lib/utils";

export function defaultChannelData() {
  return DEFAULT_CHANNELS.map((name) => ({ name, slug: createSlug(name) }));
}

export async function provisionDefaultChannels(organizationId: string) {
  await prisma.channel.createMany({
    data: defaultChannelData().map((channel) => ({
      ...channel,
      organizationId,
    })),
    skipDuplicates: true,
  });
}
