import type { Metadata } from "next";
import { client } from "@/lib/orpc";
import { MessageList } from "../../_components/MessageList";
import { MessageInput } from "../../_components/messaeg-input";

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

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="my-4 min-h-0 flex-1">
        <MessageList />
      </div>

      <div className="shrink-0 bg-background p-2 pb-3 pt-0">
        <MessageInput teamId={teamId} />
      </div>
    </section>
  );
}
