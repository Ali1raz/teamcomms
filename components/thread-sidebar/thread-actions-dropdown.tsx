"use client";

import { Edit2, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThreadActionsDropdownProps {
  canEdit: boolean;
  isDeleting?: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function ThreadActionsDropdown({
  canEdit,
  isDeleting,
  onEdit,
  onDelete,
}: ThreadActionsDropdownProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm">
            <MoreVertical />
            <span className="sr-only">Thread actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              onEdit();
            }}
          >
            <Edit2 />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              setDeleteOpen(true);
            }}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete reply</DialogTitle>
          <DialogDescription>
            This reply will be removed from the thread and cannot be restored.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={async () => {
              await onDelete();
              setDeleteOpen(false);
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
