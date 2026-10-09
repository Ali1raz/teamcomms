"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
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

export function LeaveOrganizationDialog({
  children,
  organizationId,
}: {
  children?: ReactNode;
  organizationId: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const queryClient = useQueryClient();

  const leaveOrganizationMutation = useMutation(
    orpc.organization.leave.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.organization.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.organization.members.list.queryKey(),
        });

        router.push("/organizations");
        toast.success("Organization left successfully!");
        setOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to leave organization", {
          description: error.message,
        });
      },
    })
  );

  function handleConfirm() {
    leaveOrganizationMutation.mutate({ organizationId: organizationId });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="destructive" size="sm">
            Leave Organization
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Message</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave this organization? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={leaveOrganizationMutation.isPending}
            >
              Cancel
            </Button>
          </DialogClose>

          {/* Destructive confirm button */}
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={leaveOrganizationMutation.isPending}
          >
            {leaveOrganizationMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Please wait...
              </>
            ) : (
              "Leave Organization"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
