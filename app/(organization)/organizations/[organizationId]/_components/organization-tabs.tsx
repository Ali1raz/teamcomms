"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizationRole } from "@/hooks/use-organization-role";
import { orpc } from "@/lib/orpc";
import type { OrganizationTab } from "../constants";
import {
  toChannelQueryInput,
  toOrganizationMemberQueryInput,
  toTeamQueryInput,
  useChannelFilters,
  useOrganizationMemberFilters,
  useOrganizationTab,
  useTeamFilters,
} from "../search-params";
import { ChannelTable } from "./channels/channel-table";
import { LeaveOrganizationDialog } from "./leave-organization-dialog";
import { MemberTable } from "./members/member-table";
import { OrganizationSettingsForm } from "./organization-settings-form";
import { TeamTable } from "./teams/team-table";

export function OrganizationTabs({
  organizationId,
}: {
  organizationId: string;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useOrganizationTab();
  const [memberFilters] = useOrganizationMemberFilters();
  const [teamFilters, setTeamFilters] = useTeamFilters();
  const [channelFilters, setChannelFilters] = useChannelFilters();

  const { data: organizationData } = useQuery(
    orpc.organization.list.queryOptions()
  );
  const organization = organizationData?.organizations.find(
    (item) => item.id === organizationId
  );
  const canManageOrganization = useOrganizationRole() !== "member";

  function prefetchTab(nextTab: OrganizationTab) {
    if (nextTab === "teams") {
      void queryClient.prefetchQuery(
        orpc.team.list.queryOptions({
          input: toTeamQueryInput(organizationId, teamFilters),
        })
      );
      return;
    }

    if (nextTab === "channels") {
      void queryClient.prefetchQuery(
        orpc.channel.list.queryOptions({
          input: toChannelQueryInput(organizationId, channelFilters),
        })
      );
      return;
    }

    void queryClient.prefetchQuery(
      orpc.organization.members.list.queryOptions({
        input: toOrganizationMemberQueryInput(organizationId, memberFilters),
      })
    );
  }

  function handleTabChange(value: string) {
    const nextTab = value as OrganizationTab;
    void setTeamFilters(null);
    void setChannelFilters(null);
    void setTab(nextTab);
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {organization?.name ?? "Organization"}
          </h1>

          {organization?.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm whitespace-pre-line">
              {organization.description}
            </p>
          )}
        </div>
        <LeaveOrganizationDialog organizationId={organizationId} />
      </div>

      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className="gap-4 sm:mt-4"
      >
        <TabsList variant="line" className="w-full">
          <TabsTrigger
            value="teams"
            onPointerEnter={() => prefetchTab("teams")}
            onFocus={() => prefetchTab("teams")}
          >
            Teams
          </TabsTrigger>
          <TabsTrigger
            value="channels"
            onPointerEnter={() => prefetchTab("channels")}
            onFocus={() => prefetchTab("channels")}
          >
            Channels
          </TabsTrigger>
          <TabsTrigger
            value="members"
            onPointerEnter={() => prefetchTab("members")}
            onFocus={() => prefetchTab("members")}
          >
            Members
          </TabsTrigger>
          {canManageOrganization && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="teams">
          <TeamTable organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="channels">
          <ChannelTable organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="members">
          <MemberTable organizationId={organizationId} />
        </TabsContent>
        {canManageOrganization && organization && (
          <TabsContent value="settings">
            <OrganizationSettingsForm
              organizationId={organizationId}
              currentName={organization.name}
              currentDescription={organization.description}
              currentLogo={organization.logo}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
