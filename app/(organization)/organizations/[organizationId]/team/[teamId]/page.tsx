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
    <section className="h-full flex w-full flex-col">
      <div className="flex-1 mb-4 px-2 min-h-0">
        <MessageList />
      </div>

      <div className="sticky bottom-0 shrink-0 bg-background p-2 pb-3 pt-0">
        <MessageInput teamId={teamId} />
      </div>
    </section>
  );
}
