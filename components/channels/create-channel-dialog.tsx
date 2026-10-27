"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { createChannelFormSchema } from "@/app/(organization)/organizations/schema";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { cn, createSlug } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function CreateChannelDialog({
  organizationId,
  className,
  children,
}: {
  organizationId: string;
  className?: React.ComponentProps<typeof Button>["className"];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<{ name: string }>({
    resolver: zodResolver(createChannelFormSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const channelName = useWatch({
    control: form.control,
    name: "name",
  });
  const slug = createSlug(channelName ?? "");

  const createChannelMutation = useMutation(
    orpc.channel.create.mutationOptions({
      onSuccess: (result) => {
        toast.success(`Channel #${result.channel.name} created`);
        form.reset({ name: "" });
        void queryClient.invalidateQueries({
          queryKey: orpc.channel.list.key({ type: "query" }),
        });
        setOpen(false);
        router.push(
          `/organizations/${result.channel.organizationId}/channel/${result.channel.id}`
        );
      },
      onError: (error) => {
        if (error.message.includes("already exists")) {
          form.setError("name", { message: error.message });
          return;
        }
        toast.error("Failed to create channel", {
          description: error.message,
        });
      },
    })
  );

  function onSubmit(values: { name: string }) {
    createChannelMutation.mutate({ organizationId, name: values.name });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset({ name: "" });
      }}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button
            className={cn(className)}
            variant="outline"
            size="sm"
            type="button"
          >
            <Plus className="size-4" /> Create channel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
          <DialogDescription>
            Channels are visible to every member of this organization.
          </DialogDescription>
        </DialogHeader>

        <form id="create-channel-form" onSubmit={form.handleSubmit(onSubmit)}>
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
                    autoComplete="off"
                    autoFocus
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <FieldDescription className="font-mono">
              {slug ? `# ${slug}` : "Slug will appear here"}
            </FieldDescription>
          </FieldGroup>
        </form>

        <Field className="mt-4">
          <Button
            disabled={createChannelMutation.isPending}
            type="submit"
            form="create-channel-form"
          >
            {createChannelMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating channel...
              </>
            ) : (
              <>Create channel</>
            )}
          </Button>
        </Field>
      </DialogContent>
    </Dialog>
  );
}
