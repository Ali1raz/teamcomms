"use client";

import { MoreVertical } from "lucide-react";
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
import type { ClientOutputs } from "@/lib/orpc";
import { cn } from "@/lib/utils";

type Member =
  ClientOutputs["organization"]["members"]["list"]["members"][number];

export function MemberActionsDropdown({
  member,
  organizationId,
  className,
}: {
  member: Member;
  organizationId: string;
  className?: React.ComponentProps<typeof Button>["className"];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn(className)} variant="outline" size="sm">
          <MoreVertical />
          <span className="sr-only">Actions for {member.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <UpdateMemberRoleDialog
          userId={member.id}
          currentRole={member.role}
          organizationId={organizationId}
          memberName={member.name}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            Update Role
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
            onSelect={(e) => e.preventDefault()}
            variant="destructive"
          >
            Remove
          </DropdownMenuItem>
        </RemoveMemberDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
