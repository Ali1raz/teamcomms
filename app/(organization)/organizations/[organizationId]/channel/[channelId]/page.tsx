import type { Metadata } from "next";
import { client, orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { ConversationView } from "../../_components/conversation-view";

export async function generateMetadata(
  props: PageProps<"/organizations/[organizationId]/channel/[channelId]">
): Promise<Metadata> {
  const { channelId } = await props.params;
  try {
    const { channel } = await client.channel.get({ channelId });
    return { title: channel.name };
  } catch {
    return { title: "Channel" };
  }
}

export default async function Page(
  props: PageProps<"/organizations/[organizationId]/channel/[channelId]">
) {
  const { channelId } = await props.params;

  const queryClient = getQueryClient();
  await Promise.all([
    // Prefetch mentionable users of the current organization (no team scope
    // for channels) so the client can read them with useSuspenseQuery.
    queryClient.prefetchQuery(orpc.user.mention.queryOptions({ input: {} })),
    queryClient.prefetchQuery(orpc.user.get.queryOptions()),
  ]);

  return (
    <HydrateClient client={queryClient}>
      <ConversationView scope={{ kind: "channel", channelId }} />
    </HydrateClient>
  );
}
