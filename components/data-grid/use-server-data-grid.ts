"use client";

import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import {
  type DataGridFeatures,
  type DataGridTableInstance,
  dataGridFeatures,
} from "@/components/reui/data-grid/data-grid";

type UseServerDataGridOptions<TData extends RowData> = {
  columns: ColumnDef<DataGridFeatures, TData>[];
  data: TData[];
  pageCount: number;
  getRowId: (row: TData) => string;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
};

/**
 * TanStack table wired for server-driven data: pagination and sorting are
 * controlled by the caller (URL state) and the row models stay server-side.
 */
export function useServerDataGrid<TData extends RowData>({
  columns,
  data,
  pageCount,
  getRowId,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
}: UseServerDataGridOptions<TData>): DataGridTableInstance<TData> {
  return useTable({
    features: dataGridFeatures,
    columns,
    data,
    pageCount,
    getRowId,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    autoResetPageIndex: false,
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
  });
}
