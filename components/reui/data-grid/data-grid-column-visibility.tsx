"use client";

// Opted out of React Compiler with the rest of the grid (see data-grid.tsx).
"use no memo";

import type { Table } from "@tanstack/react-table";
import type { ReactElement } from "react";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import {
  getColumnHeaderLabel,
  useDataGrid,
} from "@/components/reui/data-grid/data-grid";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function DataGridColumnVisibility<TData extends object>({
  table,
  trigger,
}: {
  table: Table<DataGridFeatures, TData>;
  trigger: ReactElement<Record<string, unknown>>;
}) {
  const { i18n } = useDataGrid();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-fit" asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-medium">
            {i18n.labels.toggleColumns}
          </DropdownMenuLabel>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  // Title-casing is for a raw column id only; an authored
                  // label keeps its own casing.
                  className={
                    getColumnHeaderLabel(column) === column.id
                      ? "capitalize"
                      : undefined
                  }
                  checked={column.getIsVisible()}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {getColumnHeaderLabel(column)}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DataGridColumnVisibility };
