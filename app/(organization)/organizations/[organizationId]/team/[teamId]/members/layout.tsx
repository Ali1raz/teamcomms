import { Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/general/empty-state";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/orpc";
import { getQueryClient } from "@/lib/query/hydration";
import { requireOrganizationAccess } from "../../../access";

type Props = { params: Promise<{ organizationId: string; teamId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamId } = await params;
  const access = await client.team.get({ teamId }).catch(() => null);

  return {
    title: access?.isMember ? `${access.team} | Members` : "Team Members",
  };
}

export default async function MembersLayout({
  children,
  params,
}: Props & { children: ReactNode }) {
  const { organizationId, teamId } = await params;

  await requireOrganizationAccess(getQueryClient(), organizationId);

  const access = await client.team.get({ teamId });

  if (!access.isMember) {
    return (
      <EmptyState
        icon={Users}
        title="You are not a member of this team"
        description="Ask an organization owner or admin to add you to this team."
        action={
          <Button asChild>
            <Link href={`/organizations/${organizationId}/team/${teamId}`}>
              Back to team
            </Link>
          </Button>
        }
      />
    );
  }

  return children;
}
