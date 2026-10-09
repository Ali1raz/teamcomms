/* eslint-disable react-hooks/incompatible-library */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { createSlug } from "@/lib/utils";
import { AttachmentChip } from "../[organizationId]/_components/attachment-chip";
import { ImageUploadDialog } from "../[organizationId]/_components/image-dialog";
import {
  type UpdateOrganizationType,
  updateOrganizationSchema,
} from "../schema";

export function UpdateOrganizationDialog({
  children,
  organizationId,
  currentName,
  currentLogo,
}: {
  children?: ReactNode;
  organizationId: string;
  currentName: string;
  currentLogo?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<UpdateOrganizationType>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: currentName,
      logo: currentLogo ?? null,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: currentName, logo: currentLogo ?? null });
    }
  }, [open, currentName, currentLogo, form]);

  const queryClient = useQueryClient();

  const updateOrganizationMutation = useMutation(
    orpc.organization.update.mutationOptions({
      onSuccess: (organization) => {
        toast.success(`"${organization.name}" updated successfully`);
        queryClient.invalidateQueries({
          queryKey: orpc.organization.list.queryKey(),
        });
        setOpen(false);
        form.reset({
          name: organization.name,
          logo: organization.logo ?? null,
        });
      },
      onError: (error) => {
        toast.error("Something bad happened, please try again!", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  function onSubmit(values: UpdateOrganizationType) {
    updateOrganizationMutation.mutate({
      organizationId,
      name: values.name,
      logo: values.logo ?? null,
    });
  }

  const watchedLogo = form.watch("logo");
  const watchedName = form.watch("name");
  const slugPreview = createSlug(watchedName ?? "");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Organization</DialogTitle>
          <DialogDescription>
            Update your organization information.
          </DialogDescription>
        </DialogHeader>
        <form
          id="update-organization-form"
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
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input id="slug" value={slugPreview} readOnly />
            </Field>
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <div className="flex items-center gap-3">
                {watchedLogo ? (
                  <AttachmentChip
                    url={watchedLogo}
                    onDelete={() => form.setValue("logo", null)}
                    onChangeComplete={(url) => form.setValue("logo", url)}
                  />
                ) : (
                  <ImageUploadDialog
                    onUploadComplete={(url) => {
                      form.setValue("logo", url, { shouldValidate: true });
                    }}
                  >
                    <Button type="button" variant="outline" size="sm">
                      Upload Logo
                    </Button>
                  </ImageUploadDialog>
                )}
              </div>
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={updateOrganizationMutation.isPending}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={updateOrganizationMutation.isPending}
            type="submit"
            form="update-organization-form"
          >
            {updateOrganizationMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Updating
                organization...
              </>
            ) : (
              <>Update Organization</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
