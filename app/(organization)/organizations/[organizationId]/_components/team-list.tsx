"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { FolderCode, Loader2, RefreshCcw } from "lucide-react";
import { CreateTeamDialog } from "@/components/create-tem-dialog";
import { EmptyState } from "@/components/general/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";
import { LeaveOrganizationDialog } from "./leave-organization-dialog";
import { TeamCard } from "./team-card";

export function TeamList({ organizationId }: { organizationId: string }) {
  const {
    data: { teams },
    isFetching,
    refetch,
  } = useSuspenseQuery(
    orpc.team.list.queryOptions({ input: { organizationId: organizationId } })
  );

  const { data: user } = useQuery(orpc.user.get.queryOptions());

  return (
    <div className="p-4 sm:p-6 max-w-4xl h-full w-full">
      <div className="flex gap-2 sm:flex-row sm:justify-between sm:items-baseline items-start flex-col mb-4">
        <div className="space-y-1">
          <h1 className="font-bold text-2xl">Teams</h1>
          <p className="text-muted-foreground text-sm">
            Teams in this organization
          </p>
        </div>
        <div className="flex gap-2 sm:mt-0 mt-4">
          <Button
            onClick={() => refetch({})}
            disabled={isFetching}
            className="w-fit"
            size="sm"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <LeaveOrganizationDialog organizationId={organizationId} />
        </div>
      </div>
      {isFetching ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-24" />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          className="mt-4 h-120"
          icon={FolderCode}
          title="No team found!"
          description="No team found in this organization, once created teams will appear here."
          titleClassName="sm:mt-8"
          descriptionClassName="text-pretty"
          action={user && user.role !== "member" ? <CreateTeamDialog /> : null}
        />
      ) : (
        <div className="mt-4 space-y-2">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              organizationId={organizationId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
