"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CancelInvitationDialog } from "./cancel-invitation-dialog";

export function InvitationTableActionsDropdown({
  invitationId,
  organizationId,
  invitationEmail,
  status,
}: {
  invitationId: string;
  organizationId: string;
  invitationEmail: string;
  status: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <CancelInvitationDialog
          invitationId={invitationId}
          organizationId={organizationId}
          invitationEmail={invitationEmail}
        >
          <DropdownMenuItem
            disabled={status !== "pending"}
            onSelect={(e) => e.preventDefault()}
            variant="destructive"
          >
            Cancel invitation
          </DropdownMenuItem>
        </CancelInvitationDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
