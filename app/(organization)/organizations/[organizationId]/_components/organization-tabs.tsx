"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orpc } from "@/lib/orpc";
import type { OrganizationTab } from "../constants";
import {
  toOrganizationMemberQueryInput,
  toTeamQueryInput,
  useOrganizationMemberFilters,
  useOrganizationTab,
  useTeamFilters,
} from "../search-params";
import { LeaveOrganizationDialog } from "./leave-organization-dialog";
import { MemberTable } from "./members/member-table";
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

  const { data: organizationData } = useQuery(
    orpc.organization.list.queryOptions()
  );
  const organization = organizationData?.organizations.find(
    (item) => item.id === organizationId
  );

  function prefetchTab(nextTab: OrganizationTab) {
    if (nextTab === "teams") {
      void queryClient.prefetchQuery(
        orpc.team.list.queryOptions({
          input: toTeamQueryInput(organizationId, teamFilters),
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
    void setTab(nextTab);
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {organization?.name ?? "Organization"}
          </h1>
        </div>
        <LeaveOrganizationDialog organizationId={organizationId} />
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="gap-4">
        <TabsList variant="line" className="w-full">
          <TabsTrigger
            value="teams"
            onPointerEnter={() => prefetchTab("teams")}
            onFocus={() => prefetchTab("teams")}
          >
            Teams
          </TabsTrigger>
          <TabsTrigger
            value="members"
            onPointerEnter={() => prefetchTab("members")}
            onFocus={() => prefetchTab("members")}
          >
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <TeamTable organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="members">
          <MemberTable organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
