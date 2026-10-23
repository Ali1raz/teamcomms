"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { DeleteChannelDialog } from "@/components/channels/delete-channel-dialog";
import { RenameChannelDialog } from "@/components/channels/rename-channel-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChannelType } from "@/lib/types";

export function ChannelTableActionsDropdown({
  channel,
  canManageOrganization,
}: {
  channel: ChannelType;
  canManageOrganization: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link
            href={`/organizations/${channel.organizationId}/channel/${channel.id}`}
          >
            Open channel
          </Link>
        </DropdownMenuItem>
        {canManageOrganization && (
          <>
            <DropdownMenuSeparator />
            <RenameChannelDialog channel={channel}>
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                Rename
              </DropdownMenuItem>
            </RenameChannelDialog>
            <DeleteChannelDialog channel={channel}>
              <DropdownMenuItem
                onSelect={(event) => event.preventDefault()}
                variant="destructive"
              >
                Delete channel
              </DropdownMenuItem>
            </DeleteChannelDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
