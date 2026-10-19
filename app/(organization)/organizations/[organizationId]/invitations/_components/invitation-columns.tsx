"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MemberRoleBadge } from "@/components/general/member-role-badge";
import { UserImage } from "@/components/general/user-avatar";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientOutputs } from "@/lib/orpc";
import { formatLocalDate, formatLocalDateTime } from "@/lib/utils";
import { invitationStatusVariant } from "../constants";
import { InvitationTableActionsDropdown } from "./invitation-table-actions-dropdown";

export type InvitationRow =
  ClientOutputs["organization"]["invitations"]["list"]["invitations"][number];

export function getInvitationColumns({
  organizationId,
}: {
  organizationId: string;
}): ColumnDef<DataGridFeatures, InvitationRow>[] {
  return [
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Invited User" />
      ),
      cell: ({ row }) => {
        const invitation = row.original;
        return (
          <div className="flex min-w-0 items-center gap-2">
            <UserImage
              image={invitation.invitedUser?.image}
              name={invitation.invitedUser?.name}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate">
                {invitation.invitedUser?.name ?? invitation.email}
              </span>
              <span className="truncate text-muted-foreground text-xs">
                {invitation.email}
              </span>
            </div>
          </div>
        );
      },
      size: 260,
      meta: {
        headerTitle: "Invited User",
        skeleton: <Skeleton className="h-8 w-48" />,
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => (
        <MemberRoleBadge role={row.original.role ?? "member"} />
      ),
      size: 100,
      meta: { skeleton: <Skeleton className="h-5 w-16" /> },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={invitationStatusVariant[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
      size: 120,
      meta: { skeleton: <Skeleton className="h-5 w-20" /> },
    },
    {
      id: "inviter",
      accessorFn: (row) => row.inviter.name,
      header: "Invited By",
      enableSorting: false,
      cell: ({ row }) => {
        const inviter = row.original.inviter;
        return (
          <div className="flex min-w-0 items-center gap-2">
            <UserImage image={inviter.image} name={inviter.name} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate">{inviter.name}</span>
              <span className="truncate text-muted-foreground text-xs">
                {inviter.email}
              </span>
            </div>
          </div>
        );
      },
      size: 220,
      meta: { skeleton: <Skeleton className="h-8 w-40" /> },
    },
    {
      id: "team",
      accessorFn: (row) => row.team?.name ?? "",
      header: "Team",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.team ? (
          <Badge className="max-w-32 truncate" variant="outline">
            {row.original.team.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
      size: 140,
      meta: { skeleton: <Skeleton className="h-5 w-24" /> },
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
      accessorKey: "expiresAt",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Expires At" />
      ),
      cell: ({ row }) => (
        <time
          className="whitespace-nowrap text-muted-foreground text-sm"
          dateTime={new Date(row.original.expiresAt).toISOString()}
          title={formatLocalDateTime(row.original.expiresAt)}
        >
          {formatLocalDate(row.original.expiresAt)}
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
      cell: ({ row }) => (
        <InvitationTableActionsDropdown
          invitationEmail={row.original.email}
          invitationId={row.original.id}
          organizationId={organizationId}
          status={row.original.status}
        />
      ),
      size: 56,
      meta: { skeleton: <Skeleton className="size-7" /> },
    },
  ];
}
