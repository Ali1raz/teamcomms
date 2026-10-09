"use client";

import {
  ChevronDownIcon,
  Home,
  LogOutIcon,
  User,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useSignOut } from "@/hooks/use-signout";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { UserImage } from "./user-avatar";

interface UserAvatarProps {
  name: string;
  email: string;
  image: string | null | undefined;
}

export default function UserAvatarDropdown({
  name,
  email,
  image,
}: UserAvatarProps) {
  const handleSignOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full">
          <UserImage className="size-8" image={image} name={name} />
          <ChevronDownIcon size={16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-64 min-w-60">
        <DropdownMenuLabel>
          <div className="flex items-start gap-2 text-left text-sm">
            <UserImage name={name} image={image} />
            <div className="grid flex-1 text-left text-sm gap-2 leading-tight">
              <span className="truncate font-medium">
                {name && name.length > 0 ? name : email.split("@")[0]}
              </span>
              <p className="text-muted-foreground truncate text-xs">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/">
              <Home size={16} aria-hidden="true" />
              <span>Home</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserCircle className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/organizations">
              <User className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={handleSignOut}
            className="cursor-pointer"
          >
            <LogOutIcon size={16} aria-hidden="true" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
