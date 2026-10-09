"use client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Hash, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { InviteOrganizationDialog } from "@/app/(organization)/organizations/_components/invite-organization-dialog";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { RemoveMemberDialog } from "@/components/remove-member-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UpdateMemberRoleDialog } from "@/components/update-member-role-dialog";
import { usePresence } from "@/hooks/use-presence";
import type { ClientOutputs } from "@/lib/orpc";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { AddMemberToTeam } from "./add-member-to-team";
import { CreateTeamDialog } from "./create-tem-dialog";
import { DeleteTeamDialog } from "./delete-team-dialog";
import { MemberRoleBadge } from "./general/member-role-badge";
import { UserImage } from "./general/user-avatar";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";
import { UpdateTeamDialog } from "./update-team-dialog";

type MembersListOutput = ClientOutputs["organization"]["members"]["list"];
type MemberType = MembersListOutput["members"][number];

export function AppSidebar({
  organizationId,
  ...props
}: React.ComponentProps<typeof Sidebar> & { organizationId: string }) {
  const {
    data: { teams },
  } = useSuspenseQuery(
    orpc.team.list.queryOptions({ input: { organizationId } })
  );
  const {
    data: { members },
  } = useSuspenseQuery(orpc.organization.members.list.queryOptions());

  const { data: user } = useQuery(orpc.user.get.queryOptions());

  const { onlineusers } = usePresence({
    room: organizationId,
    user: user ? { id: user.id } : null,
  });

  const onlineUserIds = useMemo(
    () => new Set(onlineusers.map((u) => u.id)),
    [onlineusers]
  );

  const {
    data: { currentOrganization },
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const { teamId } = useParams<{ teamId: string }>();

  const canManageOrganization = !!user && user.role !== "member";

  return (
    <Sidebar {...props}>
      <SidebarHeader className="space-y-4">
        <OrganizationSwitcher />
        <SidebarMenu className="flex items-center gap-2 w-full flex-row">
          {canManageOrganization && (
            <SidebarMenuItem className="flex-1 min-w-0">
              <SidebarMenuButton asChild>
                <CreateTeamDialog className="w-full" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {canManageOrganization && (
            <SidebarMenuItem className="flex sm:hidden">
              <SidebarMenuButton asChild className="shrink-0">
                <InviteOrganizationDialog
                  organizationId={organizationId}
                  teamId={teamId}
                  teams={teams}
                  organizationName={currentOrganization?.name || ""}
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col overflow-hidden h-full">
        {/* Teams */}
        <SidebarGroup className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SidebarMenu className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <Collapsible
              defaultOpen
              className="group/collapsible flex-1 min-h-0 flex flex-col overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  Teams
                  <ChevronRight className="ml-auto transition-transform duration-100 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {/* Keep flex sizing on a stable wrapper so Radix's internal content div cannot break scroll height propagation. */}
              <SidebarMenuItem className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0">
                  <CollapsibleContent className="h-full overflow-hidden">
                    <ScrollArea className="h-full">
                      <SidebarMenuSub>
                        {teams?.map((ch) => (
                          <SidebarMenuSubItem
                            key={ch.id}
                            className="flex items-center justify-center flex-row"
                          >
                            <SidebarMenuSubButton
                              asChild
                              isActive={teamId === ch.id}
                              className="text-muted-foreground flex-1"
                            >
                              <Link
                                href={`/organizations/${organizationId}/team/${ch.id}`}
                                title={ch.name}
                              >
                                <Hash className="size-4 shrink-0" />
                                <span className="truncate max-w-[12ch]">
                                  {ch.name}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>

                            {canManageOrganization && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-1"
                                  >
                                    <MoreVertical />
                                    <span className="sr-only">More</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48">
                                  <UpdateTeamDialog team={ch}>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                  </UpdateTeamDialog>
                                  <AddMemberToTeam
                                    organizationId={organizationId}
                                    teamId={ch.id}
                                  >
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      Add Member
                                    </DropdownMenuItem>
                                  </AddMemberToTeam>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/organizations/${organizationId}/team/${ch.id}/members`}
                                    >
                                      Manage Members
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DeleteTeamDialog team={ch}>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      variant="destructive"
                                    >
                                      Delete team
                                    </DropdownMenuItem>
                                  </DeleteTeamDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </ScrollArea>
                  </CollapsibleContent>
                </div>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>

        {/* Members */}
        <SidebarGroup className="shrink-0 flex flex-col border-t bg-accent/40 pb-4">
          <SidebarMenu>
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    Members
                    <ChevronRight className="ml-auto transition-transform duration-100 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-64">
                    <SidebarMenuSub className="flex gap-2">
                      {members?.map((member) => (
                        <SidebarMenuSubItem
                          key={member.id}
                          className="flex items-start gap-3 p-2 rounded-md hover:bg-accent truncate"
                        >
                          <UserImage
                            name={member.name}
                            image={member.image}
                            className="size-8 object-cover"
                            isOnline={
                              !!member.id && onlineUserIds.has(member.id)
                            }
                            showOnline={true}
                          />
                          <div className="flex flex-col flex-1 gap-1">
                            <div className="flex items-center justify-between">
                              <span className="leading-none max-w-[10ch]">
                                {member.name}
                              </span>
                              <MemberRoleBadge role={member.role} />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-sm max-w-[10ch] leading-none truncate text-muted-foreground">
                                {member.email}
                              </span>
                              {member.id !== user?.id &&
                                canManageOrganization && (
                                  <MemberActionsDropdown
                                    user={member}
                                    organizationId={organizationId}
                                    className="ml-auto px-1"
                                  />
                                )}
                            </div>
                          </div>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </ScrollArea>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function MemberActionsDropdown({
  user,
  organizationId,
  className,
}: {
  user: MemberType;
  organizationId: string;
  className?: React.ComponentProps<typeof Button>["className"];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn(className)} variant="outline" size="sm">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <UpdateMemberRoleDialog
          userId={user.id}
          currentRole={user.role}
          organizationId={organizationId}
          memberName={user.name}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            Update Role
          </DropdownMenuItem>
        </UpdateMemberRoleDialog>
        <DropdownMenuSeparator />
        <RemoveMemberDialog
          memberId={user.id}
          organizationId={organizationId}
          memberName={user.name}
          memberEmail={user.email}
        >
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            variant="destructive"
          >
            Remove
          </DropdownMenuItem>
        </RemoveMemberDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
