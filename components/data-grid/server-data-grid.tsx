"use client";

import type { ReactNode } from "react";
import {
  DataGrid,
  DataGridContainer,
  type DataGridTableInstance,
} from "@/components/reui/data-grid/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";

type ServerDataGridProps<TData extends object> = {
  table: DataGridTableInstance<TData>;
  recordCount: number;
  toolbar?: ReactNode;
  loadingMode?: "skeleton" | "spinner";
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  pageSizeOptions?: number[];
};

/**
 * Shared shell around the ReUI data-grid: toolbar, scrollable table and
 * pagination in one composition, with the empty/loading/error states flowing
 * through `emptyMessage` and `isLoading`.
 */
export function ServerDataGrid<TData extends object>({
  table,
  recordCount,
  toolbar,
  loadingMode,
  isLoading,
  emptyMessage,
  pageSizeOptions,
}: ServerDataGridProps<TData>) {
  return (
    <DataGrid
      emptyMessage={emptyMessage}
      isLoading={isLoading}
      loadingMode={loadingMode}
      recordCount={recordCount}
      table={table}
    >
      <div className="flex w-full flex-col gap-3">
        {toolbar}
        <DataGridContainer>
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>
        <DataGridPagination sizes={pageSizeOptions} />
      </div>
    </DataGrid>
  );
}
