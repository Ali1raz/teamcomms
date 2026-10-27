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
  teamId,
  organizationId,
  memberId,
  memberName,
  children,
}: {
  teamId: string;
  organizationId: string;
  memberId: string;
  memberName: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const removeMemberMutation = useMutation(
    orpc.team.members.remove.mutationOptions({
      onSuccess: () => {
        toast.success(`${memberName} removed from team`);
        queryClient.invalidateQueries({
          queryKey: orpc.team.members.list.queryKey({
            input: { teamId },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.team.list.queryKey({
            input: { organizationId },
          }),
        });
        setOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to remove member", { description: error.message });
      },
    })
  );

  function handleConfirm() {
    removeMemberMutation.mutate({ teamId, memberId });
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
        <DialogTitle>Remove Member from this team</DialogTitle>
        <DialogDescription>
          Are you sure to remove{" "}
          <span className="font-bold text-destructive">{memberName}</span> from
          this team?
        </DialogDescription>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={removeMemberMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>

          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={removeMemberMutation.isPending}
          >
            {removeMemberMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Member"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
