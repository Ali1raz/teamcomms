"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Ban, Loader2, RefreshCcw } from "lucide-react";
import { EmptyState } from "@/components/general/empty-state";
import { MemberRoleBadge } from "@/components/general/member-role-badge";
import { UserImage } from "@/components/general/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orpc } from "@/lib/orpc";
import { formatLocalDateTime } from "@/lib/utils";
import { InviteOrganizationDialog } from "../../../_components/invite-organization-dialog";
import { InvitationTableActionsDropdown } from "./invitation-table-actions-dropdown";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
  canceled: "outline",
};

export function InvitationList({ organizationId }: { organizationId: string }) {
  const {
    data: { invitations },
    isFetching,
    refetch,
  } = useSuspenseQuery(
    orpc.organization.invitations.list.queryOptions({
      input: { organizationId },
    })
  );

  const {
    data: { currentOrganization },
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const {
    data: { teams },
  } = useSuspenseQuery(
    orpc.team.list.queryOptions({ input: { organizationId: organizationId } })
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
        <div className="flex gap-2 sm:mt-0 mt-4">
          <Button
            onClick={() => refetch({})}
            disabled={isFetching}
            className="w-fit"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <InviteOrganizationDialog
            organizationName={currentOrganization?.name}
            teams={teams}
            organizationId={organizationId}
          >
            <Button>Invite new Member</Button>
          </InviteOrganizationDialog>
        </div>
      </div>

      {(!invitations || invitations.length === 0) && !isFetching ? (
        <div className="flex h-full items-center justify-center">
          <EmptyState
            className="py-24"
            icon={Ban}
            iconClassName="size-8 sm:size-14"
            title="No invitations found."
            description="There are no invitations. Start by creating a new invitation."
          />
        </div>
      ) : isFetching ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader className="bg-accent">
            <TableRow>
              <TableHead>Invited User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="flex flex-row gap-1 items-center">
                  <UserImage
                    image={invitation.invitedUser?.image}
                    name={invitation.invitedUser?.name}
                  />
                  <div className="flex flex-col">
                    <span className="max-w-30 truncate">
                      {invitation.invitedUser?.name}
                    </span>
                    <span className="truncate text-muted-foreground text-sm max-w-48">
                      {invitation.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <MemberRoleBadge role={invitation.role ?? "member"} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant[invitation.status] ?? "outline"}
                    className="capitalize"
                  >
                    {invitation.status}
                  </Badge>
                </TableCell>
                <TableCell className="flex flex-row gap-1 items-center">
                  <UserImage
                    image={invitation.inviter?.image}
                    name={invitation.inviter?.name}
                  />
                  <div className="flex flex-col">
                    <span className="max-w-30 truncate">
                      {invitation.inviter?.name}
                    </span>
                    <span className="truncate text-muted-foreground text-sm max-w-48">
                      {invitation.inviter?.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {invitation.team ? (
                    <Badge variant="secondary" className="truncate max-w-32">
                      {invitation.team.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatLocalDateTime(invitation.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatLocalDateTime(invitation.expiresAt)}
                </TableCell>
                <TableCell>
                  <InvitationTableActionsDropdown
                    invitationId={invitation.id}
                    organizationId={organizationId}
                    invitationEmail={invitation.email}
                    status={invitation.status}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
