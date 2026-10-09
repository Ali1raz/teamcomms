"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

export function CancelInvitationDialog({
  className,
  invitationId,
  organizationId,
  invitationEmail,
  children,
}: {
  className?: React.ComponentProps<typeof Button>["className"];
  invitationId: string;
  organizationId: string;
  invitationEmail: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  const cancelInvitationMutation = useMutation(
    orpc.organization.invitations.cancel.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.organization.invitations.list.queryKey({
            input: { organizationId },
          }),
        });

        toast.success(`Invitation canceled successfully!`);

        setOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to cancel invitation", {
          description: error.message,
        });
      },
    })
  );

  function onSubmit() {
    cancelInvitationMutation.mutate({
      invitationId,
      organizationId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className={cn(className)} variant="destructive" size="sm">
            <XCircle className="size-4" /> Cancel Invitation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <DialogHeader className="text-xs text-muted-foreground">
          <DialogTitle>Cancel Invitation</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel the invitation for{" "}
            <span className="font-medium text-foreground">
              {invitationEmail}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2">
          <DialogClose asChild disabled={cancelInvitationMutation.isPending}>
            <Button variant="outline">No, keep it</Button>
          </DialogClose>
          <Button
            disabled={cancelInvitationMutation.isPending}
            type="submit"
            variant="destructive"
            onClick={onSubmit}
          >
            {cancelInvitationMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Cancelling
                invitation...
              </>
            ) : (
              <>Yes, cancel invitation</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
