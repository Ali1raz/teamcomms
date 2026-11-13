"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Ban, Check, Loader2, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/general/empty-state";
import { MemberRoleBadge } from "@/components/general/member-role-badge";
import { OrganizationAvatar } from "@/components/general/organization-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export function OrganizationSwitcherCard() {
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const {
    data: { organizations, currentOrganization },
    isFetching,
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const queryClient = useQueryClient();
  const router = useRouter();

  const activeOrganization =
    organizations.find((w) => w.id === currentOrganization?.id) ??
    currentOrganization;

  const activeId = activeOrganization?.id;
  const activeRole =
    organizations.find((w) => w.id === activeId)?.role ?? "member";

  useEffect(() => {
    setSelectedId(activeId);
  }, [activeId]);

  async function handleSwitch(organizationId: string) {
    startTransition(async () => {
      const { data, error } = await authClient.organization.setActive({
        organizationId,
      });

      if (error) {
        toast.error("Failed to switch organization!", {
          description: error.message ?? "Unknown error",
        });
        return;
      }
      router.push(`/organizations/${organizationId}`);

      toast.success(
        `Switched to ${data?.name ?? "organization"} successfully, Redirecting please wait...`
      );
      await queryClient.invalidateQueries(
        orpc.organization.list.queryOptions()
      );
    });
  }

  if (!organizations || organizations.length === 0) {
    if (isFetching) {
      return <Skeleton className="w-full max-w-lg h-64 mx-auto" />;
    }
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          className="py-24"
          icon={Ban}
          iconClassName="size-8 sm:size-14"
          title="No organizations found."
          description="There are no organizations. Start by creating a new organization and inviting friends to start chatting."
        />
      </div>
    );
  }

  const selectedOrg = organizations.find((o) => o.id === selectedId);
  const isSame = selectedId === activeId;
  const isSwitching = isPending && !isSame;

  return (
    <div className="flex w-full mx-auto mt-10 flex-col gap-4 sm:items-center">
      <Card className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <CardHeader className="flex flex-col gap-3">
          <OrganizationAvatar
            organization={activeOrganization!}
            className="size-16 rounded-md"
          />
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">
              {activeOrganization?.name}
            </CardTitle>
            <CardDescription>
              {activeOrganization?.description ?? "No description provided."}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <MemberRoleBadge role={activeRole} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 w-full">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select organization">
                {selectedOrg && (
                  <div className="flex min-w-0 items-center gap-2">
                    <OrganizationAvatar
                      organization={selectedOrg}
                      className="size-5 shrink-0 rounded"
                    />
                    <span className="truncate">{selectedOrg.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Your Organizations</SelectLabel>
                {organizations.map((o) => (
                  <SelectItem className="group" key={o.id} value={o.id}>
                    <OrganizationAvatar
                      organization={o}
                      className="size-6 shrink-0 rounded-md"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate max-w-[20ch]">{o.name}</span>
                      <div className="flex items-center gap-2">
                        <MemberRoleBadge role={o.role} />
                        {o.id === activeId && (
                          <Badge className="shrink-0 bg-primary text-primary-foreground group-hover:text-primary-foreground!">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            className="ml-auto w-full sm:w-fit"
            variant={isSame ? "outline" : "default"}
            disabled={isPending || (!isSame && !selectedId)}
            onClick={() => {
              if (isSame && activeId) {
                router.push(`/organizations/${activeId}`);
              } else if (selectedId) {
                handleSwitch(selectedId);
              }
            }}
          >
            {isSwitching ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Switching...
              </>
            ) : isSame ? (
              <>
                Visit {activeOrganization?.name}
                <ArrowRight />
              </>
            ) : (
              "Switch"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
