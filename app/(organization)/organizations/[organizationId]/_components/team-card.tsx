"use client";

import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { AddMemberToTeam } from "@/components/add-member-to-team";
import { DeleteTeamDialog } from "@/components/delete-team-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type teamType,
  UpdateTeamDialog,
} from "@/components/update-team-dialog";
import { orpc } from "@/lib/orpc";

export function TeamCard({
  team,
  organizationId,
}: {
  team: teamType;
  organizationId: string;
}) {
  const { data: user } = useQuery(orpc.user.get.queryOptions());

  return (
    <Card className="group w-full outline-2 outline-transparent hover:outline-primary outline-offset-4 rounded-xl">
      <CardHeader>
        <CardTitle>
          <Link
            href={`/organizations/${organizationId}/team/${team.id}`}
            className="hover:underline"
          >
            {team.name}
          </Link>
        </CardTitle>
        <CardDescription>
          <Link
            href={`/organizations/${organizationId}/team/${team.id}/members`}
            className="hover:underline underline-offset-4"
          >
            Total members: {team.totalMembers}
          </Link>
        </CardDescription>
      </CardHeader>

      {user && user.role !== "member" && (
        <CardContent className="relative">
          <div className="absolute bottom-0 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <UpdateTeamDialog team={team}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit
                  </DropdownMenuItem>
                </UpdateTeamDialog>
                <AddMemberToTeam
                  organizationId={organizationId}
                  teamId={team.id}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Add Member
                  </DropdownMenuItem>
                </AddMemberToTeam>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/organizations/${organizationId}/team/${team.id}/members`}
                  >
                    Manage Members
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
          </div>
        </CardContent>
      )}
    </Card>
  );
}
