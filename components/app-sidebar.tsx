"use client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronRight,
  Hash,
  MoreVertical,
  Plus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { InviteOrganizationDialog } from "@/app/(organization)/organizations/_components/invite-organization-dialog";
import { CreateChannelDialog } from "@/components/channels/create-channel-dialog";
import { DeleteChannelDialog } from "@/components/channels/delete-channel-dialog";
import { RenameChannelDialog } from "@/components/channels/rename-channel-dialog";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { RemoveMemberDialog } from "@/components/remove-member-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UpdateMemberRoleDialog } from "@/components/update-member-role-dialog";
import { useOrganizationRole } from "@/hooks/use-organization-role";
import { usePresence } from "@/hooks/use-presence";
import { SIDEBAR_MEMBER_PREVIEW_COUNT } from "@/lib/app/constants";
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
  } = useSuspenseQuery(
    orpc.organization.members.list.queryOptions({
      input: { organizationId },
    })
  );

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

  const { teamId, channelId } = useParams<{
    teamId?: string;
    channelId?: string;
  }>();

  const channelsQuery = useQuery(
    orpc.channel.list.queryOptions({ input: { organizationId } })
  );
  const channels = channelsQuery.data?.channels ?? [];

  const canManageOrganization = useOrganizationRole() !== "member";

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
            <SidebarMenuItem className="flex md:hidden">
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
      <SidebarContent>
        {/* Channels */}
        <SidebarGroup className="border-b">
          <SidebarMenu>
            <Collapsible asChild defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    Channels
                    <ChevronRight className="ml-auto transition-transform duration-100 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                {canManageOrganization && (
                  <CreateChannelDialog organizationId={organizationId}>
                    <SidebarMenuAction asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-5"
                      >
                        <Plus />
                        <span className="sr-only">Create channel</span>
                      </Button>
                    </SidebarMenuAction>
                  </CreateChannelDialog>
                )}

                <CollapsibleContent>
                  <ScrollArea className="h-56">
                    <SidebarMenuSub>
                      {channelsQuery.isPending && (
                        <>
                          <SidebarMenuSkeleton showIcon />
                          <SidebarMenuSkeleton showIcon />
                          <SidebarMenuSkeleton showIcon />
                        </>
                      )}

                      {!channelsQuery.isPending &&
                        !channelsQuery.isError &&
                        channels.length === 0 && (
                          <SidebarMenuSubItem>
                            <p className="px-2 py-1 text-xs text-muted-foreground">
                              No channels yet.
                            </p>
                            {canManageOrganization && (
                              <CreateChannelDialog
                                organizationId={organizationId}
                              >
                                <Button type="button" variant="ghost" size="sm">
                                  Create a channel
                                </Button>
                              </CreateChannelDialog>
                            )}
                          </SidebarMenuSubItem>
                        )}

                      {channels.map((channel) => (
                        <SidebarMenuSubItem
                          key={channel.id}
                          className="flex flex-row items-center"
                        >
                          <SidebarMenuSubButton
                            asChild
                            isActive={channelId === channel.id}
                            className="text-muted-foreground flex-1"
                          >
                            <Link
                              href={`/organizations/${organizationId}/channel/${channel.id}`}
                              title={channel.name}
                              aria-current={
                                channelId === channel.id ? "page" : undefined
                              }
                            >
                              <Hash className="size-4 shrink-0" />
                              <span className="max-w-[12ch] truncate">
                                {channel.name}
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
                                  <span className="sr-only">
                                    Actions for {channel.name}
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-48">
                                <RenameChannelDialog channel={channel}>
                                  <DropdownMenuItem
                                    onSelect={(event) => event.preventDefault()}
                                  >
                                    Rename
                                  </DropdownMenuItem>
                                </RenameChannelDialog>
                                <DropdownMenuSeparator />
                                <DeleteChannelDialog channel={channel}>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={(event) => event.preventDefault()}
                                  >
                                    Delete channel
                                  </DropdownMenuItem>
                                </DeleteChannelDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </ScrollArea>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>

        {/* Teams */}
        <SidebarGroup>
          <SidebarMenu>
            <Collapsible asChild defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    Teams
                    <ChevronRight className="ml-auto transition-transform duration-100 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
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
                            <Users className="size-4 shrink-0" />
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
                                <span className="sr-only">
                                  Actions for {ch.name}
                                </span>
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
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-muted/40 p-0">
        <SidebarGroup>
          <SidebarMenu>
            <Collapsible asChild defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    Members
                    <ChevronRight className="ml-auto transition-transform duration-100 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="flex gap-2">
                    {members
                      ?.slice(0, SIDEBAR_MEMBER_PREVIEW_COUNT)
                      .map((member) => (
                        <SidebarMenuSubItem
                          key={member.id}
                          className="flex items-start gap-3 rounded-md p-2 hover:bg-accent"
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
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex min-w-0 items-center justify-between gap-2">
                              <span className="min-w-0 max-w-[10ch] truncate leading-none">
                                {member.name}
                              </span>
                              <MemberRoleBadge role={member.role} />
                            </div>
                            <div className="flex min-w-0 items-center gap-1">
                              <span className="min-w-0 max-w-[10ch] truncate text-sm leading-none text-muted-foreground">
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
                    {members &&
                      members.length > SIDEBAR_MEMBER_PREVIEW_COUNT && (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            className="text-muted-foreground"
                          >
                            <Link
                              href={`/organizations/${organizationId}?tab=members`}
                            >
                              <span>Show more</span>
                              <ArrowRight className="ml-auto" />
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
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
          <span className="sr-only">Actions for {user.name}</span>
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
