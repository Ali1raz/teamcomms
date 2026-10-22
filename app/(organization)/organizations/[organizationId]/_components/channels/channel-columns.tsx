"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Hash } from "lucide-react";
import Link from "next/link";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChannelType } from "@/lib/types";
import { formatLocalDate, formatLocalDateTime } from "@/lib/utils";
import { ChannelTableActionsDropdown } from "./channel-table-actions-dropdown";

export function getChannelColumns({
  organizationId,
  canManageOrganization,
}: {
  organizationId: string;
  canManageOrganization: boolean;
}): ColumnDef<DataGridFeatures, ChannelType>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Channel" />
      ),
      cell: ({ row }) => (
        <Link
          className="flex min-w-0 items-center gap-2 font-medium hover:underline"
          href={`/organizations/${organizationId}/channel/${row.original.id}`}
        >
          <Hash className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{row.original.name}</span>
        </Link>
      ),
      size: 280,
      meta: {
        headerTitle: "Channel",
        skeleton: <Skeleton className="h-5 w-40" />,
      },
    },
    {
      accessorKey: "totalMessages",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Messages" />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.totalMessages}
        </span>
      ),
      size: 120,
      meta: {
        headerTitle: "Messages",
        skeleton: <Skeleton className="h-4 w-10" />,
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Created At" />
      ),
      cell: ({ row }) => {
        const createdAt = new Date(row.original.createdAt);

        if (Number.isNaN(createdAt.getTime())) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }

        return (
          <time
            className="whitespace-nowrap text-muted-foreground text-sm"
            dateTime={createdAt.toISOString()}
            title={formatLocalDateTime(createdAt)}
          >
            {formatLocalDate(createdAt)}
          </time>
        );
      },
      size: 160,
      meta: { skeleton: <Skeleton className="h-4 w-28" /> },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <ChannelTableActionsDropdown
          canManageOrganization={canManageOrganization}
          channel={row.original}
        />
      ),
      size: 56,
      meta: { skeleton: <Skeleton className="size-7" /> },
    },
  ];
}
