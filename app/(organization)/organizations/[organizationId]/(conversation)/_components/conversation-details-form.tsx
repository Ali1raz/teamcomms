"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v3";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";

const detailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(20, "Name must be at most 20 characters"),
});

export function ConversationDetailsForm({
  organizationId,
  teamId,
  channelId,
  currentName,
}: {
  organizationId: string;
  teamId?: string;
  channelId?: string;
  currentName: string;
}) {
  const isChannel = Boolean(channelId);
  const schema = detailsSchema;

  type FormValues = z.infer<typeof schema>;

  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: currentName },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({ name: currentName });
  }, [currentName, form]);

  const renameChannel = useMutation(
    orpc.channel.update.mutationOptions({
      onSuccess: () => {
        toast.success("Channel updated");
        queryClient.invalidateQueries({
          queryKey: orpc.channel.list.queryKey({ input: { organizationId } }),
        });
        form.reset({ name: form.getValues("name") });
      },
      onError: (error) => {
        toast.error("Failed to update channel", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  const renameTeam = useMutation(
    orpc.team.update.mutationOptions({
      onSuccess: () => {
        toast.success("Team updated");
        queryClient.invalidateQueries({
          queryKey: orpc.team.list.queryKey({ input: { organizationId } }),
        });
        form.reset({ name: form.getValues("name") });
      },
      onError: (error) => {
        toast.error("Failed to update team", {
          description: error instanceof Error ? error.message : null,
        });
      },
    })
  );

  const isPending = isChannel ? renameChannel.isPending : renameTeam.isPending;

  function onSubmit(values: FormValues) {
    const name = (values as { name: string }).name;
    if (isChannel && channelId) {
      renameChannel.mutate({ channelId, organizationId, name });
    } else if (teamId) {
      renameTeam.mutate({ teamId, organizationId, name });
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <FieldGroup className="flex gap-2 max-w-xl">
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input
          {...form.register("name")}
          id="name"
          disabled={isPending}
          aria-invalid={!!form.formState.errors.name}
        />
        {form.formState.errors.name && (
          <FieldError errors={[form.formState.errors.name]} />
        )}
      </FieldGroup>
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save"
        )}
      </Button>
    </form>
  );
}
