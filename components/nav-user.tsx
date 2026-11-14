"use client";

import { useQuery } from "@tanstack/react-query";
import { LogOut, MoreVertical, Sun, User as UserIcon } from "lucide-react";
import Link from "next/link";
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/hooks/use-signout";
import { orpc } from "@/lib/orpc";
import { ThemeToggle } from "./general/theme-toggle";
import { UserImage } from "./general/user-avatar";

export function NavUser() {
  const { data: user } = useQuery(orpc.user.get.queryOptions());

  const handleSignOut = useSignOut();

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserImage
                className="size-8"
                image={user.image}
                name={user.name}
              />

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <p className="text-muted-foreground truncate text-xs">
                  {user.email}
                </p>
              </div>
              <MoreVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-w-64 min-w-60">
            <DropdownMenuLabel>
              <div className="flex items-start gap-2 text-left text-sm">
                <UserImage name={user?.name} image={user?.image} />
                <div className="grid flex-1 text-left text-sm gap-2 leading-tight">
                  <span className="truncate font-medium">
                    {user?.name && user.name.length > 0
                      ? user.name
                      : user?.email.split("@")[0]}
                  </span>
                  <p className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <ThemeToggle submenu>
                {/* Keep the theme affordance visible before opening its nested choices. */}
                <Sun />
                <span>Theme</span>
              </ThemeToggle>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
