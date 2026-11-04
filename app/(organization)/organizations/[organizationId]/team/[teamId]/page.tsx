import { Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/general/empty-state";
import { Button } from "@/components/ui/button";
import { client, orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { ConversationView } from "../../_components/conversation-view";

export async function generateMetadata(
  props: PageProps<"/organizations/[organizationId]/team/[teamId]">
): Promise<Metadata> {
  const { params } = props;
  const { teamId } = await params;
  const access = await client.team.get({ teamId }).catch(() => null);

  return {
    title: access?.isMember ? access.team : "Team",
  };
}

export default async function TeamIdPage(
  props: PageProps<"/organizations/[organizationId]/team/[teamId]">
) {
  const { params } = props;
  const { organizationId, teamId } = await params;

  const access = await client.team.get({ teamId });

  if (!access.isMember) {
    return (
      <EmptyState
        icon={Users}
        title="You are not a member of this team"
        description="Ask an organization owner or admin to add you to this team."
        action={
          <Button asChild>
            <Link href={`/organizations/${organizationId}`}>
              Back to organization
            </Link>
          </Button>
        }
      />
    );
  }

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
