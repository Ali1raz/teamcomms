import "server-only";

import type { QueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import { headers } from "next/headers";
import { redirect, unauthorized } from "next/navigation";
import { CURRENT_PATH_HEADER } from "@/lib/app/constants";
import { orpc } from "@/lib/orpc";
import { buildOrganizationsRedirect } from "@/lib/urls";

/**
 * Layout and page segments render in parallel, so every page that fetches
 * data for the URL organization must run this before its prefetches. Without
 * it a stale-org page starts RPCs that the server rejects with
 * ORGANIZATION_MISMATCH.
 */
export async function requireOrganizationAccess(
  queryClient: QueryClient,
  organizationId: string
) {
  const organizationList = await queryClient.fetchQuery(
    orpc.organization.list.queryOptions()
  );

  const isMember = organizationList.organizations.some(
    (organization) => organization.id === organizationId
  );

  if (!isMember) {
    unauthorized();
  }

  if (organizationList.currentOrganization?.id !== organizationId) {
    const requestHeaders = await headers();
    const currentPath =
      requestHeaders.get(CURRENT_PATH_HEADER) ??
      `/organizations/${organizationId}`;

    redirect(buildOrganizationsRedirect(organizationId, currentPath) as Route);
  }

  return organizationList;
}
