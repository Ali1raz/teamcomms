"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { MemberRoleBadge } from "@/components/general/member-role-badge";
import { OrganizationAvatar } from "@/components/general/organization-avatar";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { useOrganizationRedirectParams } from "../search-params";

export function OrganizationRedirectCard() {
  const [isPending, startTransition] = useTransition();
  const [{ organizationId, next }, setParams] = useOrganizationRedirectParams();
  const {
    data: { organizations },
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const queryClient = useQueryClient();
  const router = useRouter();

  if (!organizationId) return null;

  const org = organizations.find((o) => o.id === organizationId);
  if (!org) return null;

  const role = org.role;

  async function handleSwitch() {
    if (!organizationId) return;
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

      toast.success(
        `Switched to ${data?.name ?? org?.name ?? "organization"} successfully, Redirecting please wait...`
      );

      await queryClient.invalidateQueries(
        orpc.organization.list.queryOptions()
      );

      router.push((next ?? `/organizations/${organizationId}`) as Route);
    });
  }

  function handleCancel() {
    setParams({ organizationId: null, next: null });
  }

  return (
    <div className="flex w-full max-w-xl mx-auto flex-col gap-4 sm:items-center">
      <Alert className="">
        <AlertTitle>Switch to {org?.name}</AlertTitle>
        <AlertAction>
          <Button variant="outline" onClick={() => handleCancel()} size="xs">
            Dismiss
          </Button>
        </AlertAction>
        <AlertDescription>
          You were redirected because your current switched organization does
          not match the organization you are trying to access.
        </AlertDescription>
      </Alert>

      <Card className="flex w-full flex-col gap-4">
        <CardHeader className="flex flex-col gap-3">
          <OrganizationAvatar
            organization={org}
            className="size-16 rounded-md"
          />
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">{org.name}</CardTitle>
            <CardDescription>
              {org.description ?? "No description provided."}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <MemberRoleBadge role={role} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 w-full sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="w-full sm:w-fit"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-fit"
            disabled={isPending}
            onClick={handleSwitch}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Switching...
              </>
            ) : (
              <>
                Switch to {org.name}
                <ArrowRight />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function OrganizationRedirectCardSkeleton() {
  return <Skeleton className="w-full max-w-lg h-40 mx-auto" />;
}
