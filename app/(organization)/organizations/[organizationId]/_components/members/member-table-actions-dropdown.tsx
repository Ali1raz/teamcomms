"use client";

import { MoreHorizontal } from "lucide-react";
import { RemoveMemberDialog } from "@/components/remove-member-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpdateMemberRoleDialog } from "@/components/update-member-role-dialog";
import type { MemberRow } from "./member-columns";

export function MemberTableActionsDropdown({
  member,
  organizationId,
}: {
  member: MemberRow;
  organizationId: string;
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
        <UpdateMemberRoleDialog
          userId={member.id}
          currentRole={member.role}
          organizationId={organizationId}
          memberName={member.name}
        >
          <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
            Update role
          </DropdownMenuItem>
        </UpdateMemberRoleDialog>
        <DropdownMenuSeparator />
        <RemoveMemberDialog
          memberId={member.id}
          organizationId={organizationId}
          memberName={member.name}
          memberEmail={member.email}
        >
          <DropdownMenuItem
            onSelect={(event) => event.preventDefault()}
            variant="destructive"
          >
            Remove
          </DropdownMenuItem>
        </RemoveMemberDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
