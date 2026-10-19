"use client";

import {
  keepPreviousData,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { Loader2, RefreshCcw, Settings2 } from "lucide-react";
import { useCallback, useMemo, useTransition } from "react";
import { ServerDataGrid } from "@/components/data-grid/server-data-grid";
import { useServerDataGrid } from "@/components/data-grid/use-server-data-grid";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";
import { clampPage, PER_PAGE_OPTIONS } from "@/lib/pagination";
import { InviteOrganizationDialog } from "../../../_components/invite-organization-dialog";
import { toInvitationSortField } from "../constants";
import {
  hasActiveInvitationFilters,
  toInvitationQueryInput,
  useInvitationFilters,
} from "../search-params";
import { getInvitationColumns } from "./invitation-columns";
import { InvitationFilters } from "./invitation-filters";

export function InvitationList({ organizationId }: { organizationId: string }) {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useInvitationFilters({ startTransition });

  const {
    data,
    isPending: isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    ...orpc.organization.invitations.list.queryOptions({
      input: toInvitationQueryInput(organizationId, filters),
    }),
    placeholderData: keepPreviousData,
  });

  const {
    data: { currentOrganization },
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const {
    data: { teams },
  } = useSuspenseQuery(
    orpc.team.list.queryOptions({ input: { organizationId } })
  );

  const invitations = data?.invitations ?? [];
  const pageCount = data?.pageCount ?? 1;
  const total = data?.total ?? 0;
  const isBusy = isFetching || isPending;
  const isFiltered = hasActiveInvitationFilters(filters);

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: clampPage(filters.page, pageCount) - 1,
      pageSize: filters.perPage,
    }),
    [filters.page, filters.perPage, pageCount]
  );

  const sorting = useMemo<SortingState>(
    () => [{ id: filters.sortBy, desc: filters.sortOrder === "desc" }],
    [filters.sortBy, filters.sortOrder]
  );

  const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      setFilters({ page: next.pageIndex + 1, perPage: next.pageSize });
    },
    [pagination, setFilters]
  );

  const onSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const [first] = next;
      setFilters({
        sortBy: first ? toInvitationSortField(first.id) : null,
        sortOrder: first ? (first.desc ? "desc" : "asc") : null,
        page: 1,
      });
    },
    [sorting, setFilters]
  );

  const columns = useMemo(
    () => getInvitationColumns({ organizationId }),
    [organizationId]
  );

  const table = useServerDataGrid({
    columns,
    data: invitations,
    pageCount,
    getRowId: (row) => row.id,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
  });

  const emptyMessage = isError ? (
    <div className="flex flex-col items-center gap-3 py-6">
      <p className="text-sm">
        {error?.message || "Failed to load invitations."}
      </p>
      <Button onClick={() => refetch()} size="sm" variant="outline">
        <RefreshCcw className="size-4" />
        Retry
      </Button>
    </div>
  ) : isFiltered ? (
    <div className="flex flex-col items-center gap-3 py-6">
      <p className="text-sm">No invitations match your filters.</p>
      <Button
        onClick={() =>
          setFilters({ search: null, status: null, role: null, page: 1 })
        }
        size="sm"
        variant="outline"
      >
        Clear filters
      </Button>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 py-6">
      <p className="text-sm">No invitations yet.</p>
      <InviteOrganizationDialog
        organizationName={currentOrganization?.name}
        organizationId={organizationId}
        teams={teams}
      >
        <Button size="sm">Invite new Member</Button>
      </InviteOrganizationDialog>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex gap-2 sm:flex-row sm:justify-between sm:items-baseline items-start flex-col mb-4">
        <div className="space-y-1">
          <h1 className="font-bold text-2xl">Invitations</h1>
          <p className="text-muted-foreground text-sm">
            Manage invitations for this organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled={isBusy} onClick={() => refetch()} variant="outline">
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            {isBusy ? "Refreshing..." : "Refresh"}
          </Button>
          <InviteOrganizationDialog
            organizationName={currentOrganization?.name}
            organizationId={organizationId}
            teams={teams}
          >
            <Button>Invite new Member</Button>
          </InviteOrganizationDialog>
        </div>
      </div>

      <div className="space-y-2">
        <InvitationFilters />

        <ServerDataGrid
          emptyMessage={emptyMessage}
          isLoading={isLoading}
          pageSizeOptions={[...PER_PAGE_OPTIONS]}
          recordCount={total}
          table={table}
          toolbar={
            <DataGridColumnVisibility
              table={table}
              trigger={
                <Button size="sm" variant="outline">
                  <Settings2 className="size-4" />
                  Columns
                </Button>
              }
            />
          }
        />
      </div>
    </div>
  );
}
