"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreateOrganizationDialog } from "@/app/(organization)/organizations/_components/create-organization-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { cn, createAvatarUrl } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function OrganizationSwitcher() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isMobile } = useSidebar();

  const {
    data: { organizations, currentOrganization },
  } = useSuspenseQuery(orpc.organization.list.queryOptions());

  const [activeId, setActiveId] = useState<string | null>(
    currentOrganization?.id ?? null
  );

  // Always derive from state so UI updates immediately
  const activeOrganization =
    organizations.find((w) => w.id === activeId) ?? currentOrganization;

  const handleChange = async (id: string) => {
    if (id === activeId) return;

    const { data, error } = await authClient.organization.setActive({
      organizationId: id,
    });

    if (error) {
      toast.error(error.message ?? "Something went wrong");
      return;
    }

    setActiveId(data.id);
    queryClient.invalidateQueries({
      queryKey: orpc.user.get.queryKey(),
    });
    toast.success("Switched organization successfully, Redirecting...");
    void queryClient.invalidateQueries(orpc.organization.list.queryOptions());
    router.push(`/organizations/${data.id}`);
  };

  if (!activeOrganization) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-full px-4 py-5 mt-2">
              <div className="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Image
                  alt="logo"
                  src={
                    activeOrganization.logo ??
                    createAvatarUrl(activeOrganization.name)
                  }
                  width={20}
                  height={20}
                  unoptimized
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <span className="truncate font-medium line-clamp-1">
                {activeOrganization.name}
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={8}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Your Organizations
            </DropdownMenuLabel>

            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleChange(org.id)}
                className={cn(
                  "flex items-center gap-2 justify-between p-2 group",
                  org.id === activeId && "bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-xs border">
                    <Image
                      alt="logo"
                      src={org.logo || createAvatarUrl(org.name)}
                      width={20}
                      height={20}
                      unoptimized
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  {org.name}
                </div>
                {org.id === activeId && (
                  <Badge className="bg-primary text-primary-foreground group-hover:text-primary-foreground!">
                    Active
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="my-4" asChild>
              <CreateOrganizationDialog>
                <Button onClick={(e) => e.stopPropagation()} className="w-full">
                  Create Organization
                </Button>
              </CreateOrganizationDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
