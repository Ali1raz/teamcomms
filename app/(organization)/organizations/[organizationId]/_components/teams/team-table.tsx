"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { Loader2, Plus, RefreshCcw, Settings2 } from "lucide-react";
import { useCallback, useMemo, useTransition } from "react";
import { CreateTeamDialog } from "@/components/create-tem-dialog";
import { ServerDataGrid } from "@/components/data-grid/server-data-grid";
import { useServerDataGrid } from "@/components/data-grid/use-server-data-grid";
import { DataGridColumnVisibility } from "@/components/reui/data-grid/data-grid-column-visibility";
import { Button } from "@/components/ui/button";
import { useOrganizationRole } from "@/hooks/use-organization-role";
import { PER_PAGE_OPTIONS } from "@/lib/app/constants";
import { orpc } from "@/lib/orpc";
import { clampPage } from "@/lib/pagination";
import { toTeamSortField } from "../../constants";
import {
  hasActiveTeamFilters,
  toTeamQueryInput,
  useTeamFilters,
} from "../../search-params";
import { getTeamColumns } from "./team-columns";
import { TeamFilters } from "./team-filters";

export function TeamTable({ organizationId }: { organizationId: string }) {
  const [isFilterPending, startTransition] = useTransition();
  const [filters, setFilters] = useTeamFilters({ startTransition });

  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    ...orpc.team.list.queryOptions({
      input: toTeamQueryInput(organizationId, filters),
    }),
    placeholderData: keepPreviousData,
  });

  const teams = data?.teams ?? [];
  const pageCount = data?.pageCount ?? 1;
  const total = data?.total ?? 0;
  const canManageOrganization = useOrganizationRole() !== "member";
  const isRefreshing = isFetching && !isPending;
  const isLoading = isPending || isFetching || isFilterPending;
  const isFiltered = hasActiveTeamFilters(filters);

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

      if (!first) {
        setFilters({
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
          page: 1,
        });
        return;
      }

      setFilters({
        sortBy: toTeamSortField(first.id),
        sortOrder: first.desc ? "desc" : "asc",
        page: 1,
      });
    },
    [filters.sortBy, filters.sortOrder, sorting, setFilters]
  );

  const columns = useMemo(
    () => getTeamColumns({ organizationId, canManageOrganization }),
    [organizationId, canManageOrganization]
  );

  const table = useServerDataGrid({
    columns,
    data: teams,
    pageCount,
    getRowId: (row) => row.id,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
  });

  const emptyMessage = isError ? (
    <div role="status" className="flex flex-col items-center gap-3 py-6">
      <p className="text-sm">{error?.message || "Failed to load teams."}</p>
      <Button onClick={() => refetch()} size="sm" variant="outline">
        <RefreshCcw className="size-4" />
        Retry
      </Button>
    </div>
  ) : isFiltered ? (
    <div className="flex flex-col items-center gap-3 py-6">
      <p className="text-sm">No teams match your filters.</p>
      <Button
        onClick={() => setFilters({ search: null, page: 1 })}
        size="sm"
        variant="outline"
      >
        Clear filters
      </Button>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 py-6">
      <p className="text-sm">No teams yet.</p>
      {canManageOrganization && (
        <CreateTeamDialog>
          <Button size="sm">
            <Plus className="size-4" />
            Create team
          </Button>
        </CreateTeamDialog>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold tracking-tight">Teams</h2>
          <p className="text-sm text-muted-foreground">
            Teams in this organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={isFetching}
            onClick={() => refetch()}
            size="sm"
            variant="outline"
          >
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          {canManageOrganization && (
            <CreateTeamDialog>
              <Button size="sm">
                <Plus className="size-4" />
                Create team
              </Button>
            </CreateTeamDialog>
          )}
        </div>
      </div>

      <TeamFilters />

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
  );
}
