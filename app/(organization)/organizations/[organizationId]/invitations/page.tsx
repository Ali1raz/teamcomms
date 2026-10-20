import type { Metadata } from "next";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { InvitationList } from "./_components/invitation-table";
import {
  loadInvitationSearchParams,
  toInvitationQueryInput,
} from "./search-params";

export const metadata: Metadata = {
  title: "Invitations",
  description: "Manage invitations for this organization",
};

export default async function InvitationsPage(
  props: PageProps<"/organizations/[organizationId]/invitations">
) {
  const { params, searchParams } = props;
  const { organizationId } = await params;
  const filters = await loadInvitationSearchParams(searchParams);

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    orpc.organization.invitations.list.queryOptions({
      input: toInvitationQueryInput(organizationId, filters),
    })
  );

  return (
    <div className="p-4 sm:px-6 w-full max-w-6xl">
      <HydrateClient client={queryClient}>
        <InvitationList organizationId={organizationId} />
      </HydrateClient>
    </div>
  );
}
