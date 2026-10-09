"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ThemeToggle } from "@/components/general/theme-toggle";
import UserAvatarDropdown from "@/components/general/user-avatar-dropdown";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { orpc } from "@/lib/orpc";
import { InviteOrganizationDialog } from "../../_components/invite-organization-dialog";

export function OrganizationHeader() {
  const { teamId, organizationId } = useParams<{
    teamId: string;
    organizationId: string;
  }>();
  const {
    data: { currentOrganization },
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const userData = useQuery(orpc.user.get.queryOptions());
  const user = userData.data;

  const {
    data: { teams },
  } = useSuspenseQuery(
    orpc.team.list.queryOptions({ input: { organizationId: organizationId } })
  );
  const activeTeam = teamId
    ? teams.find((team) => team.id === teamId)
    : undefined;

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10 bg-background/40 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      {activeTeam?.name ? (
        <div className="flex items-center gap-1 text-lg font-mono">
          <span>#</span>
          <span className="truncate max-w-[10ch]">{activeTeam.name}</span>
        </div>
      ) : (
        <span className="text-lg font-mono">TeamComms</span>
      )}
      <div className="ml-auto flex items-center gap-4">
        {user && user.role !== "member" && (
          <div className="hidden sm:flex">
            <InviteOrganizationDialog
              organizationId={organizationId}
              organizationName={currentOrganization?.name}
              teams={teams}
              teamId={teamId}
            />
          </div>
        )}

        <ThemeToggle />
        {userData.isLoading ? (
          <div className="bg-muted-50 rounded-full h-8 w-16"></div>
        ) : (
          user && (
            <UserAvatarDropdown
              email={user.email}
              image={user.image}
              name={user.name}
            />
          )
        )}
      </div>
    </header>
  );
}
