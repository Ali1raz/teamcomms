"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { AvatarGroup } from "@/components/general/avatar-group";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientOutputs } from "@/lib/orpc";
import { formatLocalDate, formatLocalDateTime } from "@/lib/utils";
import { TeamTableActionsDropdown } from "./team-table-actions-dropdown";

export type TeamRow = ClientOutputs["team"]["list"]["teams"][number];

export function getTeamColumns({
  organizationId,
  canManageOrganization,
}: {
  organizationId: string;
  canManageOrganization: boolean;
}): ColumnDef<DataGridFeatures, TeamRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Team" />
      ),
      cell: ({ row }) => (
        <Link
          className="truncate font-medium hover:underline"
          href={`/organizations/${organizationId}/team/${row.original.id}`}
        >
          {row.original.name}
        </Link>
      ),
      size: 280,
      meta: {
        headerTitle: "Team",
        skeleton: <Skeleton className="h-5 w-40" />,
      },
    },
    {
      id: "members",
      header: "Members",
      enableSorting: false,
      cell: ({ row }) => (
        <AvatarGroup
          emptyFallback={
            <span className="text-muted-foreground text-sm">—</span>
          }
          items={row.original.members}
          overflowLabel={(count) =>
            `${count} more ${count === 1 ? "member" : "members"}`
          }
          size="sm"
          totalCount={row.original.totalMembers}
        />
      ),
      size: 180,
      meta: {
        headerTitle: "Members",
        skeleton: <Skeleton className="h-8 w-24 rounded-full" />,
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Created At" />
      ),
      cell: ({ row }) => (
        <time
          className="whitespace-nowrap text-muted-foreground text-sm"
          dateTime={new Date(row.original.createdAt).toISOString()}
          title={formatLocalDateTime(row.original.createdAt)}
        >
          {formatLocalDate(row.original.createdAt)}
        </time>
      ),
      size: 160,
      meta: { skeleton: <Skeleton className="h-4 w-28" /> },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) =>
        canManageOrganization ? (
          <TeamTableActionsDropdown
            team={row.original}
            organizationId={organizationId}
          />
        ) : null,
      size: 56,
      meta: { skeleton: <Skeleton className="size-7" /> },
    },
  ];
}
