import type { Metadata } from "next";
import { SITE } from "@/lib/app/site";
import { orpc } from "@/lib/orpc";
import { getQueryClient } from "@/lib/query/hydration";

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE.name}`,
    default: SITE.name,
  },
};

export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(orpc.organization.members.list.queryOptions()),
  ]);

  return <main>{children}</main>;
}
