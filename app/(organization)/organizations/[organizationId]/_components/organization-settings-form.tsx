"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/lib/orpc";
import { cn, createSlug, getOrganizationColor } from "@/lib/utils";
import {
  type UpdateOrganizationType,
  updateOrganizationSchema,
} from "../../schema";
import { AttachmentChip } from "./attachment-chip";
import { ImageUploadDialog } from "./image-dialog";

export function OrganizationSettingsForm({
  organizationId,
  currentName,
  currentDescription,
  currentLogo,
}: {
  organizationId: string;
  currentName: string;
  currentDescription?: string | null;
  currentLogo?: string | null;
}) {
  const queryClient = useQueryClient();
  const form = useForm<UpdateOrganizationType>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: currentName,
      description: currentDescription ?? "",
      logo: currentLogo ?? null,
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      name: currentName,
      description: currentDescription ?? "",
      logo: currentLogo ?? null,
    });
  }, [currentName, currentDescription, currentLogo, form]);

  const updateOrganizationMutation = useMutation(
    orpc.organization.update.mutationOptions({
      onSuccess: (organization) => {
        toast.success(`"${organization.name}" updated successfully`);
        queryClient.invalidateQueries({
          queryKey: orpc.organization.list.queryKey(),
        });
        form.reset({
          name: organization.name,
          description: organization.description ?? "",
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
      description: values.description ?? "",
      logo: values.logo ?? null,
    });
  }

  const watchedLogo = form.watch("logo");
  const watchedName = form.watch("name");
  const slugPreview = createSlug(watchedName ?? "");

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-semibold tracking-tight">
          Organization settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Update your organization information.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
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
                  autoComplete="organization"
                  disabled={updateOrganizationMutation.isPending}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Field>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input id="slug" value={slugPreview} readOnly disabled />
          </Field>
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  value={field.value ?? ""}
                  placeholder="Tell members what this organization is about"
                  aria-invalid={fieldState.invalid && fieldState.isTouched}
                  disabled={updateOrganizationMutation.isPending}
                />
                <FieldDescription>
                  Optional, but highly recommended.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field>
            <FieldLabel>Logo</FieldLabel>
            <div className="flex items-end gap-3">
              {watchedLogo ? (
                <AttachmentChip
                  url={watchedLogo}
                  onDelete={() => form.setValue("logo", null)}
                  onChangeComplete={(url) => form.setValue("logo", url)}
                />
              ) : (
                <>
                  <div
                    className={cn(
                      "size-24 object-cover shrink-0 rounded-full",
                      getOrganizationColor(organizationId)
                    )}
                  />
                  <ImageUploadDialog
                    onUploadComplete={(url) => {
                      form.setValue("logo", url, { shouldValidate: true });
                    }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={updateOrganizationMutation.isPending}
                    >
                      Upload Logo
                    </Button>
                  </ImageUploadDialog>
                </>
              )}
            </div>
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          disabled={updateOrganizationMutation.isPending}
          className="w-fit"
        >
          {updateOrganizationMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Updating organization...
            </>
          ) : (
            "Update Organization"
          )}
        </Button>
      </form>
    </section>
  );
}
