import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { RightSidebar } from "@/components/thread-sidebar/right-sidebar";
import { ThreadProvider } from "@/components/thread-sidebar/thread-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { orpc } from "@/lib/orpc";
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { OrganizationHeader } from "./_components/organization-header";
import { RealtimeProviderWrapper } from "./_components/realtime-provider-wrapper";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(orpc.organization.list.queryOptions()),
    queryClient.prefetchQuery(
      orpc.team.list.queryOptions({
        input: { organizationId: organizationId },
      })
    ),
    queryClient.prefetchQuery(
      orpc.organization.members.list.queryOptions({
        input: { organizationId },
      })
    ),
    queryClient.prefetchQuery(
      orpc.channel.list.queryOptions({ input: { organizationId } })
    ),
  ]);
  return (
    <SidebarProvider defaultOpenRight={false}>
      <ThreadProvider>
        <HydrateClient client={queryClient}>
          <AppSidebar organizationId={organizationId} />
        </HydrateClient>
        <RealtimeProviderWrapper>
          <SidebarInset className="flex h-dvh flex-col overflow-hidden">
            <HydrateClient client={queryClient}>
              <OrganizationHeader />
            </HydrateClient>
            <main className="overflow-scroll flex flex-1 flex-col min-h-0">
              {children}
            </main>
          </SidebarInset>
          <RightSidebar
            collapsible="offcanvas"
            variant="sidebar"
            side="right"
          />
        </RealtimeProviderWrapper>
      </ThreadProvider>
    </SidebarProvider>
  );
}
