import type { Metadata } from "next";
import { unauthorized } from "next/navigation";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { OrganizationHeader } from "../_components/organization-header";
import { requireOrganizationAccess } from "../access";
import { SavedMessageList } from "./_components/saved-message-list";
import {
  loadSavedMessageSearchParams,
  toSavedMessageQueryInput,
} from "./search-params";

export const metadata: Metadata = {
  title: "Saved messages",
  description: "Your saved messages in this organization",
};

export default async function SavedMessagesPage(
  props: PageProps<"/organizations/[organizationId]/saved">
) {
  const { params, searchParams } = props;
  const { organizationId } = await params;

  const filters = await loadSavedMessageSearchParams(searchParams);

  const queryClient = getQueryClient();
  await requireOrganizationAccess(queryClient, organizationId);

  await queryClient.prefetchQuery(
    orpc.organization.savedMessages.list.queryOptions({
      input: toSavedMessageQueryInput(organizationId, filters),
    })
  );

  return (
    <HydrateClient client={queryClient}>
      <OrganizationHeader />
      <div className="p-4 sm:px-6 w-full max-w-5xl h-full overflow-y-auto">
        <SavedMessageList organizationId={organizationId} />
      </div>
    </HydrateClient>
  );
}
