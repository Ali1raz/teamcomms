---
name: using-nuqs
description: "nuqs URL state: one shared parser contract drives client hooks, server loaders, and typed API input. Use when adding or changing URL-backed filters, pagination, sorting, table state, or deep links; reading search params in a Next.js server component; or validating them with Standard Schema or Zod."
---

# nuqs URL state

Search params are application state, not component state. nuqs keeps one **contract** — a parser object — as the single source of truth for the URL, the client hook, the server loader, and the value that reaches the API.

## The contract

Put it beside the route in `<feature>/<feature>-search-params.ts`, with allowed values in `<feature>/constants.ts` (the route convention in `AGENTS.md`). Shared modules import parsers and helpers from `nuqs/server`; only the client hook imports from `nuqs`.

`app/(organization)/organizations/[organizationId]/invitations/search-params.ts` is the reference implementation:

```ts
import { type Options, useQueryStates } from "nuqs";
import {
  createLoader,
  type inferParserType,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { MembershipRole } from "@/generated/prisma/enums";
import { normalizePage } from "@/lib/pagination";
import { paginationParsers } from "@/lib/search-params/pagination";
import {
  INVITATION_SORT_FIELDS,
  INVITATION_SORT_ORDERS,
  INVITATION_STATUSES,
} from "./constants";

export const invitationParsers = {
  ...paginationParsers,
  search: parseAsString.withDefault(""),
  status: parseAsStringEnum([...INVITATION_STATUSES]),
  role: parseAsStringEnum(Object.values(MembershipRole)),
  sortBy: parseAsStringEnum([...INVITATION_SORT_FIELDS]).withDefault(
    "createdAt",
  ),
  sortOrder: parseAsStringEnum([...INVITATION_SORT_ORDERS]).withDefault("desc"),
};

export type InvitationSearchParams = inferParserType<typeof invitationParsers>;

export const loadInvitationSearchParams = createLoader(invitationParsers);

export function useInvitationFilters(options: Options = {}) {
  return useQueryStates(invitationParsers, { shallow: false, ...options });
}

export function toInvitationQueryInput(
  organizationId: string,
  params: InvitationSearchParams,
) {
  return {
    organizationId,
    page: normalizePage(params.page),
    perPage: params.perPage,
    search: params.search || undefined,
    status: params.status ?? undefined,
    role: params.role ?? undefined,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };
}

export function hasActiveInvitationFilters(params: InvitationSearchParams) {
  return Boolean(params.search || params.status || params.role);
}
```

Each export has one job: `parsers` is the contract; `load…` reads it on the server; `use…Filters` reads and writes it on the client; `to…QueryInput` crosses into the API; `hasActive…` drives reset and empty-state UI.

## Workflow

1. **Inventory the URL state.** Read the page, the API input schema, and the list or table. Choose what must survive reload and sharing: `page`, `perPage`, `search`, filters, `sortBy`, `sortOrder`, tab, view, expanded row.
   **Done when** every URL-worthy value has a parser, an API field, and a control, and none of it lives in `useState`.

2. **Write the contract.** Spread `paginationParsers` from `lib/search-params/pagination.ts`. Build closed sets from existing constants, Prisma enums, or shared lists. Put defaults on parsers, never in components. Derive the type with `inferParserType<typeof parsers>`.
   **Done when** the server page and the client component import the same parser object, and no enum or union is copied into a component or a hand-written type.

3. **Read it on the server.** Load the params, map them once, and prefetch the client query with the same `queryOptions` the client uses.

   ```tsx
   const filters = await loadInvitationSearchParams(searchParams);

   const queryClient = getQueryClient();
   await queryClient.prefetchQuery(
     orpc.organization.invitations.list.queryOptions({
       input: toInvitationQueryInput(organizationId, filters),
     }),
   );

   return (
     <HydrateClient client={queryClient}>
       <InvitationList organizationId={organizationId} />
     </HydrateClient>
   );
   ```

   Use `createSearchParamsCache` only when a nested Server Component needs the params; see `references/api.md`.
   **Done when** a deep link with all params server-renders the correct first page, and an invalid value falls back to its default without crashing.

4. **Drive it on the client.** Use the hook with the transition, fetch with `keepPreviousData`, and translate between URL and table state in both directions.

   ```tsx
   const [isPending, startTransition] = useTransition();
   const [filters, setFilters] = useInvitationFilters({ startTransition });

   const { data, isFetching } = useQuery({
     ...orpc.organization.invitations.list.queryOptions({
       input: toInvitationQueryInput(organizationId, filters),
     }),
     placeholderData: keepPreviousData,
   });

   const isBusy = isFetching || isPending;

   const onPaginationChange = (next: PaginationState) =>
     setFilters({
       page: next.pageIndex + 1, // table is 0-based, the URL is 1-based
       perPage: next.pageSize,
     });
   ```

   `isBusy` drives the toolbar's disabled and spinner state. Reset `page: 1` whenever search, filter, or sort changes. Use `shallow: false` when the RSC tree depends on the params (the repo default); use `shallow: true` only when the data is purely client-fetched.
   **Done when** a control updates the URL, the query key, and the rows; Back and Forward restore each; no filter value is duplicated in local state.

5. **Tame the text input.** Keep the input in local state and push to the URL after a debounce. `app/(organization)/organizations/[organizationId]/invitations/_components/invitation-filters.tsx` holds the full back/forward-safe effect: a `lastPushedRef` distinguishes external changes from the debounced write.
   **Done when** typing causes one URL update per pause, and Back or Forward updates the input without overwriting an in-flight value.

6. **Validate at the boundary.** Loaders parse but do not validate: `parseAsInteger` accepts `-1`, and `parseAsStringEnum` only guards the listed values. Clamp in the mapper, enforce constraints in the API schema, or pass `{ strict: true }` to the loader call when an invalid URL must fail loudly. Reuse the contract with `createStandardSchemaV1(parsers)` for Standard Schema consumers, and `parseAsJson(zodSchema)` for JSON-shaped params.
   **Done when** one allowed-value list feeds the parser, the API schema, and the UI, and a malformed URL either falls back deterministically or fails by design.

## Modes

| Need                                   | Client                                   | Server                              |
| -------------------------------------- | ---------------------------------------- | ----------------------------------- |
| Prefetched then filtered on the client | `useQueryStates` + TanStack Query        | `createLoader` + prefetch + hydrate |
| Client-only list                       | `useQueryStates` + TanStack Query        | none                                |
| Server-rendered links only             | none                                     | `createLoader` + `createSerializer` |
| Params needed deep in the RSC tree     | `useQueryStates` with the same `parsers` | `createSearchParamsCache`           |

Both fetching modes read the same contract, so switching which side fetches never changes the URL shape. `createSerializer` is the way to build `<Link href>` values that match the hook's output. Read it in `references/api.md` before hand-building query strings.

## Rules

- The URL is the source of truth. Local state is only for input that has not been committed yet.
- `null` removes a key from the URL. For nullable parsers, reset with `null`, not `""`.
- A default is not written to the URL unless `clearOnDefault: false`; reading a missing or invalid value returns the default.
- Import from `nuqs/server` in anything that server code can import. Import hooks from `nuqs` only in `"use client"` files.
- Options precedence is call level > parser `.withOptions` > hook options.
- Pagination in the URL is 1-based; TanStack Table's `pageIndex` is 0-based. Convert at the edge and clamp against `pageCount`.
- Use `limitUrlUpdates: debounce(...)` only when updates trigger a server request (`shallow: false`). For client-side fetching, debounce the value before calling the setter and leave throttling at its default.
- `history: "push"` is for navigation-like changes such as tabs; the default replace keeps the Back button useful for filters.

## Failure modes

- Changing a filter but leaving `page` at 5, producing an empty page. Reset `page: 1` in the same update.
- Passing `parseAsStringEnum(stringArray)` where the tuple was not `as const`; the literal type widens.
- Prefetching with a different input object than the client uses; hydration misses and the client refetches.

## Reference

`references/api.md` covers the parser catalogue, builder methods, options, and the server helpers (`createLoader`, `createSearchParamsCache`, `createSerializer`, `createStandardSchemaV1`).
