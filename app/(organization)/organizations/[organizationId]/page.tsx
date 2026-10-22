import type { Metadata } from "next";
import { client, orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { OrganizationTabs } from "./_components/organization-tabs";
import {
  loadChannelSearchParams,
  loadOrganizationMemberSearchParams,
  loadTeamSearchParams,
  toChannelQueryInput,
  toOrganizationMemberQueryInput,
  toTeamQueryInput,
} from "./search-params";

export async function generateMetadata(
  props: PageProps<"/organizations/[organizationId]">
): Promise<Metadata> {
  const { params } = props;
  const { organizationId } = await params;
  const { organizations } = await client.organization.list();
  const organization = organizations.find((w) => w.id === organizationId);

  return {
    title: organization?.name ?? "Organization",
  };
}

export default async function Page(
  props: PageProps<"/organizations/[organizationId]">
) {
  const { params, searchParams } = props;
  const { organizationId } = await params;
  const memberFilters = await loadOrganizationMemberSearchParams(searchParams);
  const teamFilters = await loadTeamSearchParams(searchParams);
  const channelFilters = await loadChannelSearchParams(searchParams);

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(orpc.organization.list.queryOptions()),
    queryClient.prefetchQuery(
      orpc.team.list.queryOptions({
        input: toTeamQueryInput(organizationId, teamFilters),
      })
    ),
    queryClient.prefetchQuery(
      orpc.channel.list.queryOptions({
        input: toChannelQueryInput(organizationId, channelFilters),
      })
    ),
    queryClient.prefetchQuery(
      orpc.organization.members.list.queryOptions({
        input: toOrganizationMemberQueryInput(organizationId, memberFilters),
      })
    ),
  ]);

  return (
    <HydrateClient client={queryClient}>
      <OrganizationTabs organizationId={organizationId} />
    </HydrateClient>
  );
}
