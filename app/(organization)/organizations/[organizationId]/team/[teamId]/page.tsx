import type { Metadata } from "next";
import { client } from "@/lib/orpc";
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

  return <ConversationView scope={{ kind: "team", teamId }} />;
}
