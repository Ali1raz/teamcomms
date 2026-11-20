"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ThemeToggle } from "@/components/general/theme-toggle";
import UserAvatarDropdown from "@/components/general/user-avatar-dropdown";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizationRole } from "@/hooks/use-organization-role";
import { orpc } from "@/lib/orpc";
import type { ConversationTab } from "../../constants";
import {
  toTeamMemberQueryInput,
  useConversationTab,
  useTeamMemberFilters,
} from "../../search-params";
import { ConversationDetailsForm } from "./conversation-details-form";
import { ConversationView } from "./conversation-view";
import { TeamMemberTable } from "./team-member-table";

export function ConversationShell({
  organizationId,
  teamId,
  channelId,
  conversationName,
}: {
  organizationId: string;
  teamId?: string;
  channelId?: string;
  conversationName?: string;
}) {
  const isTeam = Boolean(teamId);
  const isChannel = Boolean(channelId);

  const queryClient = useQueryClient();
  const [tab, setTab] = useConversationTab();
  const [memberFilters, setMemberFilters] = useTeamMemberFilters();
  const canManage = useOrganizationRole() !== "member";

  const tabItems = [
    { value: "messages", label: "Messages" },
    ...(isTeam ? [{ value: "members", label: "Members" }] : []),
    ...(canManage ? [{ value: "settings", label: "Settings" }] : []),
  ];
  const currentTabLabel =
    tabItems.find((item) => item.value === tab)?.label ?? "Messages";

  const { data: user } = useQuery(orpc.user.get.queryOptions());

  function prefetchTab(nextTab: ConversationTab) {
    if (nextTab === "members" && isTeam && teamId) {
      void queryClient.prefetchQuery(
        orpc.team.members.list.queryOptions({
          input: toTeamMemberQueryInput(teamId, memberFilters),
        })
      );
    }
  }

  function handleTabChange(value: string) {
    const nextTab = value as ConversationTab;
    void setMemberFilters(null);
    void setTab(nextTab);
  }

  const scope = isChannel
    ? { kind: "channel" as const, channelId: channelId! }
    : { kind: "team" as const, teamId: teamId! };

  return (
    <Tabs
      value={tab}
      onValueChange={handleTabChange}
      className="flex flex-1 flex-col min-h-0"
    >
      <header className="flex shrink-0 flex-col gap-2 px-4 pb-0 pt-2 border-b sticky top-0 z-10 bg-background/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          {conversationName ? (
            <div className="flex items-center gap-1 text-lg font-mono">
              <span>#</span>
              <span className="truncate max-w-[10ch]">{conversationName}</span>
            </div>
          ) : (
            <span className="text-lg font-mono">TeamComms</span>
          )}
          <div className="ml-auto flex items-center sm:gap-4 gap-2">
            <ThemeToggle />
            {user && (
              <UserAvatarDropdown
                email={user.email}
                image={user.image}
                name={user.name}
              />
            )}
          </div>
        </div>

        <div className="sm:hidden">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>{currentTabLabel}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-56">
                    {tabItems.map((item) => (
                      <li key={item.value}>
                        <NavigationMenuLink
                          className={
                            item.value === tab
                              ? "flex w-full items-center bg-muted"
                              : "flex w-full items-center hover:bg-muted"
                          }
                        >
                          <button onClick={() => handleTabChange(item.value)}>
                            {item.label}
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <TabsList variant="line" className="hidden sm:flex sm:**:px-6 **:px-4">
          <TabsTrigger
            value="messages"
            onPointerEnter={() => prefetchTab("messages")}
            onFocus={() => prefetchTab("messages")}
          >
            Messages
          </TabsTrigger>
          {isTeam && (
            <TabsTrigger
              value="members"
              onPointerEnter={() => prefetchTab("members")}
              onFocus={() => prefetchTab("members")}
            >
              Members
            </TabsTrigger>
          )}
          {canManage && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>
      </header>

      <div className="flex-1 min-h-0 overflow-scroll">
        <TabsContent value="messages" className="h-full">
          <ConversationView scope={scope} />
        </TabsContent>
        {isTeam && teamId && (
          <TabsContent className="p-4 sm:p-6 max-w-5xl" value="members">
            <TeamMemberTable organizationId={organizationId} teamId={teamId} />
          </TabsContent>
        )}
        <TabsContent className="p-4 sm:p-6 max-w-5xl" value="settings">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Settings</h2>
              <p className="text-sm text-muted-foreground">
                {conversationName}
              </p>
            </div>

            <ConversationDetailsForm
              organizationId={organizationId}
              teamId={teamId}
              channelId={channelId}
              currentName={conversationName ?? ""}
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
