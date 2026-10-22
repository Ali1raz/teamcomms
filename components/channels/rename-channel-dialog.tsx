"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { renameChannelFormSchema } from "@/app/(organization)/organizations/schema";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import type { ChannelType } from "@/lib/types";
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

export function RenameChannelDialog({
  channel,
  className,
  children,
}: {
  channel: ChannelType;
  className?: React.ComponentProps<typeof Button>["className"];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<{ name: string }>({
    resolver: zodResolver(renameChannelFormSchema),
    defaultValues: { name: channel.name },
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: channel.name });
    }
  }, [open, channel.name, form]);

  const channelName = useWatch({
    control: form.control,
    name: "name",
  });
  const slug = createSlug(channelName ?? "");

  const updateChannelMutation = useMutation(
    orpc.channel.update.mutationOptions({
      onSuccess: (result) => {
        toast.success(`Channel renamed to #${result.channel.name}`);
        form.reset({ name: result.channel.name });
        void queryClient.invalidateQueries({
          queryKey: orpc.channel.list.key({ type: "query" }),
        });
        setOpen(false);
      },
      onError: (error) => {
        if (error.message.includes("already exists")) {
          form.setError("name", { message: error.message });
          return;
        }
        toast.error("Failed to rename channel", {
          description: error.message,
        });
      },
    })
  );

  function onSubmit(values: { name: string }) {
    updateChannelMutation.mutate({ channelId: channel.id, name: values.name });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset({ name: channel.name });
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
            <Pencil className="size-4" /> Rename
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename channel</DialogTitle>
          <DialogDescription>Update this channel.</DialogDescription>
        </DialogHeader>

        <form id="rename-channel-form" onSubmit={form.handleSubmit(onSubmit)}>
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

            <FieldDescription>
              {slug ? `#${slug}` : "Slug will appear here"}
            </FieldDescription>
          </FieldGroup>
        </form>

        <Field className="mt-4">
          <Button
            disabled={updateChannelMutation.isPending}
            type="submit"
            form="rename-channel-form"
          >
            {updateChannelMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Saving...
              </>
            ) : (
              <>Save changes</>
            )}
          </Button>
        </Field>
      </DialogContent>
    </Dialog>
  );
}
