import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { isOrpcErrorWithCode } from "@/lib/orpc-error";
import { buildOrganizationsRedirect } from "@/lib/urls";
import { serializer } from "../serializer";

function redirectOnOrgMismatch(error: unknown) {
  if (!isOrpcErrorWithCode(error, "ORGANIZATION_MISMATCH")) return;
  if (typeof window === "undefined") return;

  const path = window.location.pathname + window.location.search;
  const match = window.location.pathname.match(/^\/organizations\/([^/]+)/);
  const organizationId = match?.[1] ?? "";
  window.location.assign(buildOrganizationsRedirect(organizationId, path));
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: redirectOnOrgMismatch }),
    mutationCache: new MutationCache({ onError: redirectOnOrgMismatch }),
    defaultOptions: {
      queries: {
        queryKeyHashFn(queryKey) {
          const [json, meta] = serializer.serialize(queryKey);
          return JSON.stringify({ json, meta });
        },
        staleTime: 60 * 1000, // > 0 to prevent immediate refetching on mount
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        serializeData(data) {
          const [json, meta] = serializer.serialize(data);
          return { json, meta };
        },
      },
      hydrate: {
        deserializeData(data) {
          return serializer.deserialize(data.json, data.meta);
        },
      },
    },
  });
}
