import type { Metadata } from "next";
import { SITE } from "@/lib/app/site";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE.name}`,
    default: SITE.name,
  },
  robots: { index: false, follow: false },
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  await Promise.all([queryClient.prefetchQuery(orpc.user.get.queryOptions())]);
  return (
    <main>
      <HydrateClient client={queryClient}>{children}</HydrateClient>
    </main>
  );
}
