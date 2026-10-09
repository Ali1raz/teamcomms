"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { createSlug } from "@/lib/utils";
import {
  type CreateOrganizationType,
  createOrganizationSchema,
} from "../schema";

export function CreateOrganizationDialog({
  children,
}: {
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateOrganizationType>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  });

  const organizationName = useWatch({
    control: form.control,
    name: "name",
  });
  const slug = createSlug(organizationName ?? "");
  const queryClient = useQueryClient();

  const createOrganizationMutation = useMutation(
    orpc.organization.create.mutationOptions({
      onSuccess: (organization) => {
        toast.success(`${organization.name} organization created successfully`);
        queryClient.invalidateQueries({
          queryKey: orpc.organization.list.queryKey(),
        });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast.error("Something bad happened, please try again!", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  function onSubmit(values: CreateOrganizationType) {
    createOrganizationMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? <Button>Create Organization</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>Create a new organization.</DialogDescription>
        </DialogHeader>
        <form
          id="create-organization-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
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
                    autoComplete="name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              {/* Show the derived slug so users can preview what will be created. */}
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input id="slug" value={slug} readOnly />
            </Field>
          </FieldGroup>
        </form>

        <Field className="mt-4">
          <Button
            disabled={createOrganizationMutation.isPending}
            type="submit"
            form="create-organization-form"
          >
            {createOrganizationMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating
                organization...
              </>
            ) : (
              <>Create Organization</>
            )}
          </Button>
        </Field>
      </DialogContent>
    </Dialog>
  );
}
