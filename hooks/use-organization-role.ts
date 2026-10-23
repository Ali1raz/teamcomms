"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import type { MembershipRole } from "@/generated/prisma/enums";
import { orpc } from "@/lib/orpc";

export function useOrganizationRole(): MembershipRole {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { data } = useSuspenseQuery(orpc.organization.list.queryOptions());

  return (
    data.organizations.find((item) => item.id === organizationId)?.role ??
    "member"
  );
}
