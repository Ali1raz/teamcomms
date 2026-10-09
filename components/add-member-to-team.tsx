"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc";
import { UserImage } from "./general/user-avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "./ui/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { ScrollArea } from "./ui/scroll-area";

export function AddMemberToTeam({
  teamId,
  children,
  organizationId,
}: {
  teamId: string;
  children?: React.ReactNode;
  organizationId: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const {
    data: { members },
  } = useSuspenseQuery(orpc.organization.members.list.queryOptions());

  const {
    data: { members: teamMembers },
  } = useSuspenseQuery(
    orpc.team.members.list.queryOptions({ input: { teamId } })
  );
  const teamMemberIds = new Set(teamMembers.map((m) => m.id));

  const nonTeamMembers = members.filter((m) => !teamMemberIds.has(m.id));

  const allSelected =
    selected.size === nonTeamMembers.length && nonTeamMembers.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(nonTeamMembers.map((m) => m.id)));
    }
  }

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  const queryClient = useQueryClient();

  const addMemberMutation = useMutation(
    orpc.team.members.add.mutationOptions({
      onSuccess: () => {
        toast.success("Members added successfully!");
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
        setSelected(new Set());
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to add members", { description: error.message });
      },
    })
  );

  function handleAdd() {
    addMemberMutation.mutate({
      teamId,
      memberIds: [...selected],
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setSelected(new Set());
      }}
    >
      <DialogTrigger asChild>
        {children ?? <Button>Add Member</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add Member to Team</DialogTitle>
        <DialogDescription>
          Following are the all organization members, choose from them, or
          invite new users.
          <HoverCard>
            <HoverCardTrigger>
              <Info className="size-4 animate-in" />
            </HoverCardTrigger>
            <HoverCardContent align="start">
              <p>Selected members are already in this team.</p>
            </HoverCardContent>
          </HoverCard>
        </DialogDescription>
        <div className="flex items-center justify-between w-full">
          <h3>
            {selected.size > 0 ? `Selected: (${selected.size})` : "Select"}
          </h3>

          <FieldGroup className="w-24">
            <Field
              orientation="horizontal"
              className="flex flex-row items-center gap-1"
            >
              <FieldLabel htmlFor="select-all">Select All</FieldLabel>
              <Checkbox
                id="select-all"
                checked={
                  allSelected
                    ? true
                    : someSelected && !allSelected
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={toggleAll}
              />
            </Field>
          </FieldGroup>
        </div>
        <ScrollArea className="max-h-56 flex-col flex gap-4 min-h-0 w-full">
          {members.map((member) => (
            <FieldLabel key={member.id} className="not-last:mb-2">
              <Field className="relative inset-0">
                <FieldContent className="flex flex-row items-center gap-2">
                  <UserImage image={member.image} name={member.name} />
                  <div className="flex flex-col gap-1">
                    <FieldTitle>
                      <span>{member.name}</span>
                      <Badge variant="ghost">{member.role}</Badge>
                    </FieldTitle>
                    <FieldDescription>{member.email}</FieldDescription>
                  </div>
                  <Checkbox
                    id={`toggle-checkbox-${member.id}`}
                    name={`toggle-checkbox-${member.id}`}
                    className="absolute bottom-4 right-4"
                    checked={
                      teamMemberIds.has(member.id) || selected.has(member.id)
                    }
                    disabled={teamMemberIds.has(member.id)}
                    onCheckedChange={() => toggleMember(member.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={addMemberMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>

          {/* Destructive confirm button */}
          <Button
            onClick={handleAdd}
            disabled={selected.size === 0 || addMemberMutation.isPending}
          >
            {addMemberMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Adding...
              </>
            ) : (
              `Add`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
