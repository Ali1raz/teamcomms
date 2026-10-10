"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ImageUploadDialog } from "@/app/(organization)/organizations/[organizationId]/_components/image-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Session } from "@/lib/auth";
import { tryCatch } from "@/lib/try-catch";
import { updateProfileAction } from "../actions";
import { type UpdateProfileType, updateProfileSchema } from "../schema";

export function UpdateProfileForm({ session }: { session: Session }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<UpdateProfileType>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      imageKey:
        session?.user?.image && !session.user.image.includes("avatar.vercel.sh")
          ? session.user.image
          : "",
    },
    mode: "onChange",
  });

  function onSubmit(values: UpdateProfileType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        updateProfileAction(values, session?.user?.id || "")
      );
      if (error) {
        toast.error("Something bad happened");
        return;
      }
      if (result.status === "error") {
        toast.error(result.message, { duration: 9000 });
      } else if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
      }
    });
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Update Your Profile</h1>
      <p className="text-muted-foreground mb-4">
        Update your profile information
      </p>
      <section className="mt-4">
        <div className="space-y-4">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-6"
          >
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Your name"
                      aria-invalid={fieldState.invalid && fieldState.isTouched}
                    />
                    <FieldDescription>
                      This is your display name. Choose a readable name.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="imageKey"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Profile Image</FieldLabel>
                    <div className="flex items-center gap-4">
                      {field.value ? (
                        <div className="flex items-end gap-2">
                          <div className="relative size-32 overflow-hidden rounded-full">
                            <Image
                              src={field.value}
                              alt="Profile"
                              fill
                              className="object-cover size-24"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange("")}
                          >
                            <X className="size-4" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <ImageUploadDialog
                          onUploadComplete={(url) => field.onChange(url)}
                        >
                          <Button type="button" variant="outline" size="sm">
                            <ImageIcon className="size-4" /> Upload Image
                          </Button>
                        </ImageUploadDialog>
                      )}
                    </div>
                    <FieldDescription>
                      This is optional but highly recommended.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" disabled={isPending} className="w-fit">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  &nbsp;Updating profile...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </form>
        </div>
      </section>
    </section>
  );
}
