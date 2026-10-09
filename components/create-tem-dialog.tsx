"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  type CreateTeamType,
  createTeamSchema,
} from "@/app/(organization)/organizations/schema";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
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

export function CreateTeamDialog({
  className,
  children,
}: {
  className?: React.ComponentProps<typeof Button>["className"];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const form = useForm<CreateTeamType>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  const teamName = useWatch({
    control: form.control,
    name: "name",
  });

  const slug = createSlug(teamName ?? "");
  const queryClient = useQueryClient();

  const createTeamMutation = useMutation(
    orpc.team.create.mutationOptions({
      onSuccess: (newTeam) => {
        toast.success(`Team ${newTeam.name} created successfully!`);
        form.reset();
        queryClient.invalidateQueries({
          queryKey: orpc.team.list.queryKey({
            input: { organizationId: newTeam.organizationId },
          }),
        });
        setOpen(false);
        router.push(
          `/organizations/${newTeam.organizationId}/team/${newTeam.id}`
        );
      },
      onError: (error) => {
        toast.error("Something bad happened, please try again!", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  function onSubmit(values: CreateTeamType) {
    createTeamMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className={cn(className)} variant="outline" size="sm">
            <Plus className="size-4" /> Create Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <DialogHeader className="text-xs text-muted-foreground">
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>Create new team to get started</DialogDescription>
        </DialogHeader>
        <form id="team-form" onSubmit={form.handleSubmit(onSubmit)}>
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
            disabled={createTeamMutation.isPending}
            type="submit"
            form="team-form"
          >
            {createTeamMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating Team...
              </>
            ) : (
              <>Create Team</>
            )}
          </Button>
        </Field>
      </DialogContent>
    </Dialog>
  );
}
