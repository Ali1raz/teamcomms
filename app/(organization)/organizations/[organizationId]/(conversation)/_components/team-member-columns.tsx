"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MemberRoleBadge } from "@/components/general/member-role-badge";
import { UserImage } from "@/components/general/user-avatar";
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientOutputs } from "@/lib/orpc";
import { RemoveMemberDialog } from "./remove-member-dialog";

export type TeamMemberRow =
  ClientOutputs["team"]["members"]["list"]["members"][number];

export function getTeamMemberColumns({
  organizationId,
  teamId,
  currentUserId,
  canManage,
}: {
  organizationId: string;
  teamId: string;
  currentUserId: string | undefined;
  canManage: boolean;
}): ColumnDef<DataGridFeatures, TeamMemberRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Member" />
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex min-w-0 items-center gap-2">
            <UserImage image={member.image} name={member.name} />
            <span className="truncate">{member.name}</span>
          </div>
        );
      },
      size: 240,
      meta: {
        headerTitle: "Member",
        skeleton: <Skeleton className="h-8 w-40" />,
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="truncate text-muted-foreground text-sm">
          {row.original.email}
        </span>
      ),
      size: 260,
      meta: {
        headerTitle: "Email",
        skeleton: <Skeleton className="h-4 w-48" />,
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => <MemberRoleBadge role={row.original.role} />,
      size: 120,
      meta: { skeleton: <Skeleton className="h-5 w-16" /> },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) =>
        canManage && row.original.id !== currentUserId ? (
          <RemoveMemberDialog
            teamId={teamId}
            organizationId={organizationId}
            memberId={row.original.id}
            memberName={row.original.name}
          >
            <button className="text-sm text-destructive">Remove</button>
          </RemoveMemberDialog>
        ) : null,
      size: 56,
      meta: { skeleton: <Skeleton className="size-7" /> },
    },
  ];
}
