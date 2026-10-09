"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { orpc } from "@/lib/orpc";

export function RemoveMemberDialog({
  memberId,
  organizationId,
  memberName,
  memberEmail,
  children,
}: {
  memberId: string;
  organizationId: string;
  memberName: string;
  memberEmail: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const removeMemberMutation = useMutation(
    orpc.organization.members.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.organization.members.list.queryKey(),
        });
        toast.success(`${memberName} has been removed from the organization`);
        setOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to remove member", { description: error.message });
      },
    })
  );

  function handleConfirm() {
    removeMemberMutation.mutate({
      userId: memberId,
      organizationId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="destructive" size="sm">
            Remove Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <DialogTitle>Remove Member</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove{" "}
          <span className="font-bold">{memberName}</span>{" "}
          <span className="text-muted-foreground">{memberEmail}</span> from this
          organization? This action cannot be undone.
        </DialogDescription>

        <DialogFooter className="gap-2">
          <DialogClose asChild disabled={removeMemberMutation.isPending}>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button
            onClick={handleConfirm}
            disabled={removeMemberMutation.isPending}
            variant="destructive"
          >
            {removeMemberMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
