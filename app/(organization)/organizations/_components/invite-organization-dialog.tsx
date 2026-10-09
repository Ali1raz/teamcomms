"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ChevronDownIcon, InfoIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MembershipRole } from "@/generated/prisma/enums";
import { type client, orpc } from "@/lib/orpc";
import { type InviteMemberSchemaType, inviteMemberSchema } from "../schema";

export function InviteOrganizationDialog({
  children,
  organizationId,
  organizationName,
  teams,
  teamId,
}: {
  children?: ReactNode;
  organizationId: string;
  organizationName: string | undefined;
  teams: Awaited<ReturnType<typeof client.team.list>>["teams"];
  teamId?: string;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<InviteMemberSchemaType>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
      organizationId: organizationId,
      resend: true,
      teamId: teamId || null,
    },
    mode: "onChange",
  });

  const createInviteMutation = useMutation(
    orpc.organization.members.invite.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation sent successfully!");
        form.reset();
        setOpen(false);
      },
      onError: (error) => {
        toast.error("Something bad happened, please try again!", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  function onSubmit(values: InviteMemberSchemaType) {
    createInviteMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <InviteButtonGroup
            organizationId={organizationId}
            onInviteClick={() => setOpen(true)}
          />
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            Invite a member to{" "}
            <span className="text-primary font-bold">
              {organizationName ?? "this"}
            </span>{" "}
            organization.
          </DialogDescription>
        </DialogHeader>
        <form id="invite-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="flex flex-col gap-4">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid && fieldState.isTouched}
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                    <HoverCard openDelay={10} closeDelay={100}>
                      <HoverCardTrigger>
                        <InfoIcon className="size-4" />
                      </HoverCardTrigger>
                      <HoverCardContent
                        className="space-y-2 *:text-sm *:text-muted-foreground"
                        align="center"
                        side="top"
                      >
                        <p>owner: Full access.</p>
                        <p>
                          admin: Full access except delete organization/change
                          owner.
                        </p>
                        <p>member: read-only on organization data.</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Select
                    defaultValue="member"
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select a role</SelectLabel>
                        {Object.values(MembershipRole).map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="organizationId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Organization
                    <span className="text-muted-foreground">
                      (currently active)
                    </span>
                  </FieldLabel>
                  <Select
                    defaultValue={organizationId}
                    disabled={!!organizationId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select an organization"
                        defaultValue={organizationId}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select an organization</SelectLabel>
                        <SelectItem value={organizationId}>
                          {organizationName}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="teamId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Team</FieldLabel>
                  <Select
                    defaultValue={teamId}
                    onValueChange={(value) =>
                      value ? field.onChange(value) : null
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select a team"
                        defaultValue={teamId}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select a team</SelectLabel>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="resend"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  orientation="horizontal"
                >
                  <Checkbox
                    id={field.name}
                    onCheckedChange={field.onChange}
                    checked={field.value}
                    aria-invalid={fieldState.invalid && fieldState.isTouched}
                  />
                  <FieldLabel htmlFor={field.name}>
                    Resend Invitation (if already sent)
                  </FieldLabel>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <Field className="mt-4">
          <Button
            disabled={createInviteMutation.isPending}
            type="submit"
            form="invite-form"
          >
            {createInviteMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Sending
                invitation...
              </>
            ) : (
              <>Invite Member</>
            )}
          </Button>
        </Field>
      </DialogContent>
    </Dialog>
  );
}

interface InviteButtonGroupProps {
  onInviteClick: () => void;
  organizationId: string;
}

function InviteButtonGroup({
  onInviteClick,
  organizationId,
}: InviteButtonGroupProps) {
  return (
    <ButtonGroup>
      <Button onClick={onInviteClick}>Invite</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="p-1">
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <Link href={`/organizations/${organizationId}/invitations`}>
              <DropdownMenuItem>See All invitations</DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}
