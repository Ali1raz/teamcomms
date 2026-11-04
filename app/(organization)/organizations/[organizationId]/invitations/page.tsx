import type { Metadata } from "next";
import { unauthorized } from "next/navigation";
import { orpc } from "@/lib/orpc";
import { isManagerRole } from "@/lib/permissions";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { requireOrganizationAccess } from "../access";
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
  const organizationList = await requireOrganizationAccess(
    queryClient,
    organizationId
  );
  const role = organizationList.organizations.find(
    (organization) => organization.id === organizationId
  )?.role;

  if (!role || !isManagerRole(role)) {
    unauthorized();
  }

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
