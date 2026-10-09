"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Ban,
  Check,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { DeleteOrganizationDialog } from "@/components/delete-organization-dialog";
import { MemberRoleBadge } from "@/components/general/member-role-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { cn, getOrganizationColor } from "@/lib/utils";
import { UpdateOrganizationDialog } from "./update-organization-dialog";

export function OrganizationList() {
  const [isPending, startTransition] = useTransition();

  const {
    data: { organizations, currentOrganization },
    isFetching,
    refetch,
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const queryClient = useQueryClient();

  const activeOrganization =
    organizations.find((w) => w.id === currentOrganization?.id) ??
    currentOrganization;

  const router = useRouter();

  async function handleSwitch(organizationId: string) {
    startTransition(async () => {
      const { data, error } = await authClient.organization.setActive({
        organizationId: organizationId,
      });

      if (error) {
        toast.error("Failed to switch organization!", {
          description: error.message ?? "Unknown error",
        });
        return;
      }

      toast.success(
        `Switched to ${data.name} organization successfully, Redirecting please wait...`
      );
      router.push(`/organizations/${data.id}`);
      await queryClient.invalidateQueries(
        orpc.organization.list.queryOptions()
      );
    });
  }

  return (
    <div className="flex w-full mx-auto mt-10 max-w-4xl flex-col gap-4">
      <Button
        onClick={() => refetch()}
        disabled={isFetching || isPending}
        className="w-fit"
      >
        {isFetching ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCcw className="size-4" />
        )}{" "}
        {isFetching ? "Refreshing..." : "Refresh"}
      </Button>
      {(!organizations || organizations?.length === 0) && !isFetching && (
        <div className="flex items-center justify-center h-full">
          <Empty className="h-full bg-muted/40 py-24">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="bg-muted rounded-full size-28"
              >
                <Ban className="sm:size-14 size-8" />
              </EmptyMedia>
              <EmptyTitle className="sm:text-4xl sm:mt-6 mt-4 text-2xl">
                No organizations found.
              </EmptyTitle>
              <EmptyDescription className="sm:w-xl w-sm sm:text-lg text-xs">
                There are no organizations. Start by creating a new organization
                and inviting friends to start chatting.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      {isFetching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="w-full h-26" />
          <Skeleton className="w-full h-26" />
          <Skeleton className="w-full h-26" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((ws) => (
            <Card
              key={ws.id}
              className={cn(
                "w-full",
                ws.id === activeOrganization?.id &&
                  "outline-2 outline-offset-4 outline-primary/40"
              )}
            >
              <CardHeader className="flex gap-2 items-start">
                {ws.logo ? (
                  <div className="size-8 relative overflow-hidden rounded-full">
                    <Image
                      alt={ws.name}
                      src={ws.logo}
                      width={20}
                      height={20}
                      unoptimized
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "size-8 rounded-full transition-all duration-100",
                      getOrganizationColor(ws.id)
                    )}
                  />
                )}
                <div className="space-y-1">
                  <CardTitle>
                    <h1 className="line-clamp-1 truncate">
                      {ws.id === activeOrganization?.id ? (
                        <Link
                          className="font-bold flex items-center gap-1 underline hover:underline-primary"
                          href={`/organizations/${ws.id}`}
                        >
                          {ws.name} <ArrowUpRight className="size-4" />
                        </Link>
                      ) : (
                        `${ws.name}`
                      )}
                    </h1>
                  </CardTitle>
                  <CardDescription>
                    <p>Total Members: {ws.totalMembers}</p>
                    <p>Total Teams: {ws.totalTeams}</p>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <MemberRoleBadge role={ws.role} />
                  {ws.id === activeOrganization?.id && (
                    <Badge variant="secondary">
                      <Check /> Active
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-52">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>
                          Organization options
                        </DropdownMenuLabel>
                        {ws.id !== activeOrganization?.id && (
                          <DropdownMenuItem onClick={() => handleSwitch(ws.id)}>
                            Switch to this Organization
                          </DropdownMenuItem>
                        )}
                        {ws.role !== "member" && (
                          <>
                            <UpdateOrganizationDialog
                              organizationId={ws.id}
                              currentName={ws.name}
                              currentLogo={ws.logo}
                            >
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                Update Organization
                              </DropdownMenuItem>
                            </UpdateOrganizationDialog>
                            <DropdownMenuSeparator />
                            <DeleteOrganizationDialog organizationId={ws.id}>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                variant="destructive"
                              >
                                Delete Organization
                              </DropdownMenuItem>
                            </DeleteOrganizationDialog>{" "}
                          </>
                        )}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
