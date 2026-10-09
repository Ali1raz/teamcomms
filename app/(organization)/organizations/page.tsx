import type { Metadata } from "next";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { CreateOrganizationDialog } from "./_components/create-organization-dialog";
import { OrganizationHeader } from "./_components/header";
import { OrganizationList } from "./_components/organization-list";

export const metadata: Metadata = {
  title: "Organizations",
};

export default async function Organizations() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(orpc.organization.list.queryOptions());

  return (
    <div className="h-screen bg-muted/20 w-full">
      <HydrateClient client={queryClient}>
        <OrganizationHeader />
      </HydrateClient>
      <div className="max-w-6xl mx-auto px-4 py-8 mt-6 pt-16 space-y-4">
        <div className="flex sm:justify-between items-start sm:items-center sm:flex-row flex-col gap-3">
          <h1 className="text-2xl md:text-4xl font-bold">Organizations</h1>
          <CreateOrganizationDialog />
        </div>

        <HydrateClient client={queryClient}>
          <OrganizationList />
        </HydrateClient>
      </div>
    </div>
  );
}
