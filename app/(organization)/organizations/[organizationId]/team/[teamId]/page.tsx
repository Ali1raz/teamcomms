import type { Metadata } from "next";
import { client, orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { ConversationView } from "../../_components/conversation-view";

export async function generateMetadata(
  props: PageProps<"/organizations/[organizationId]/team/[teamId]">
): Promise<Metadata> {
  const { params } = props;
  const { teamId } = await params;
  const { team } = await client.team.get({ teamId });

  return {
    title: team,
  };
}

export default async function TeamIdPage(
  props: PageProps<"/organizations/[organizationId]/team/[teamId]">
) {
  const { params } = props;
  const { teamId } = await params;

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(
      orpc.user.mention.queryOptions({ input: { teamId } })
    ),
    queryClient.prefetchQuery(orpc.user.get.queryOptions()),
  ]);

  return (
    <HydrateClient client={queryClient}>
      <ConversationView scope={{ kind: "team", teamId }} />
    </HydrateClient>
  );
}
