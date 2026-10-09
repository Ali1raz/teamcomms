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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MembershipRole } from "@/generated/prisma/enums";
import { orpc } from "@/lib/orpc";

const ROLE_OPTIONS = Object.values(MembershipRole);

export function UpdateMemberRoleDialog({
  userId,
  organizationId,
  memberName,
  currentRole,
  children,
}: {
  userId: string;
  organizationId: string;
  memberName: string;
  currentRole: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation(
    orpc.organization.members.updateRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.organization.members.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.user.get.queryKey(),
        });
        toast.success(`${memberName}'s role updated`);
        setOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to update role", { description: error.message });
      },
    })
  );

  function handleConfirm() {
    if (selectedRole === currentRole) {
      toast.info("No changes made");
      setOpen(false);
      return;
    }
    updateRoleMutation.mutate({
      userId,
      role: selectedRole as keyof typeof MembershipRole,
      organizationId,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSelectedRole(currentRole);
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            Update Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <DialogTitle>Update Role</DialogTitle>
        <DialogDescription>
          Change the role of <span className="font-bold">{memberName}</span> in
          this organization. Current role:{" "}
          <span className="font-medium">{currentRole}</span>.
        </DialogDescription>

        <div className="py-4">
          <Select
            value={selectedRole}
            onValueChange={setSelectedRole}
            disabled={updateRoleMutation.isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem
                  key={role}
                  value={role}
                  disabled={role === currentRole}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={updateRoleMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>

          <Button
            onClick={handleConfirm}
            disabled={
              selectedRole === currentRole || updateRoleMutation.isPending
            }
          >
            {updateRoleMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
