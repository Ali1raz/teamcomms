"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type client, orpc } from "@/lib/orpc";
import { type UpdateTeamType, updateTeamSchema } from "@/lib/schema";
import { cn, createSlug } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export type teamType = Awaited<
  ReturnType<typeof client.team.list>
>["teams"][number];

export function UpdateTeamDialog({
  className,
  team,
  children,
}: {
  className?: React.ComponentProps<typeof Button>["className"];
  team: teamType;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<UpdateTeamType>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      name: team.name,
      teamId: team.id,
    },
    mode: "onChange",
  });

  const teamName = useWatch({
    control: form.control,
    name: "name",
  });

  const slug = createSlug(teamName ?? "");

  const queryClient = useQueryClient();

  const updateTeamMutation = useMutation(
    orpc.team.update.mutationOptions({
      onSuccess: (team) => {
        toast.success(`Team "${team.name}" has been updated.`);

        form.reset();
        queryClient.invalidateQueries({
          queryKey: orpc.team.list.queryKey({
            input: { organizationId: team.organizationId },
          }),
        });
        setOpen(false);
      },
      onError: (error) => {
        toast.error("Something bad happened, please try again!", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  function onSubmit(values: UpdateTeamType) {
    updateTeamMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className={cn(className)} variant="outline" size="sm">
            <Plus className="size-4" /> Update Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <DialogHeader className="text-xs text-muted-foreground">
          <DialogTitle>Update Team</DialogTitle>
          <DialogDescription>Update team details</DialogDescription>
        </DialogHeader>
        <form id="update-team-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="flex flex-col gap-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid && fieldState.isTouched}
                    autoComplete="team-name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {slug && (
              <p>
                will be created as:{" "}
                <code className="bg-muted text-muted-foreground px-1 w-fit">
                  {slug}
                </code>
              </p>
            )}
          </FieldGroup>
        </form>

        <Field className="mt-4">
          <Button
            disabled={updateTeamMutation.isPending}
            type="submit"
            form="update-team-form"
          >
            {updateTeamMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Updating Team...
              </>
            ) : (
              <>Update Team</>
            )}
          </Button>
        </Field>
      </DialogContent>
    </Dialog>
  );
}
