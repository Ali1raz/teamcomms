import type { Metadata } from "next";
import { client } from "@/lib/orpc";
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
  return <ConversationView scope={{ kind: "channel", channelId }} />;
}
