"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function DeleteOrganizationDialog({
  className,
  organizationId,
  children,
}: {
  className?: React.ComponentProps<typeof Button>["className"];
  organizationId: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const queryClient = useQueryClient();

  function onSubmit() {
    startTransition(async () => {
      const { error } = await authClient.organization.delete({
        organizationId: organizationId,
      });

      if (error) {
        toast.error(error.message ?? "Failed to delete organization");
        return;
      }
      await queryClient.invalidateQueries(
        orpc.organization.list.queryOptions()
      );
      toast.success(`Deleted organization successfully!`);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className={cn(className)} variant="destructive" size="sm">
            <Trash2 className="size-4" /> Delete Organization
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <DialogHeader className="text-xs text-muted-foreground">
          <DialogTitle>Delete Organization</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this organization?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2">
          <DialogClose asChild disabled={isPending}>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={isPending}
            type="submit"
            variant="destructive"
            onClick={onSubmit}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Deleting
                Organization...
              </>
            ) : (
              <>Delete Organization</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
