"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { AddMemberToTeam } from "@/components/add-member-to-team";
import { DeleteTeamDialog } from "@/components/delete-team-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpdateTeamDialog } from "@/components/update-team-dialog";
import type { TeamRow } from "./team-columns";

export function TeamTableActionsDropdown({
  team,
  organizationId,
}: {
  team: TeamRow;
  organizationId: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <UpdateTeamDialog team={team}>
          <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
            Edit
          </DropdownMenuItem>
        </UpdateTeamDialog>
        <AddMemberToTeam organizationId={organizationId} teamId={team.id}>
          <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
            Add member
          </DropdownMenuItem>
        </AddMemberToTeam>
        <DropdownMenuItem asChild>
          <Link
            href={`/organizations/${organizationId}/team/${team.id}/members`}
          >
            Manage members
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteTeamDialog team={team}>
          <DropdownMenuItem
            onSelect={(event) => event.preventDefault()}
            variant="destructive"
          >
            Delete team
          </DropdownMenuItem>
        </DeleteTeamDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
