"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useThread } from "@/components/thread-sidebar/thread-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSidebarWithSide } from "@/components/ui/sidebar";
import { conversationKey } from "@/lib/conversation";
import { orpc } from "@/lib/orpc";
import type { ChannelType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

export function DeleteChannelDialog({
  channel,
  className,
  children,
}: {
  channel: ChannelType;
  className?: React.ComponentProps<typeof Button>["className"];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { channelId } = useParams<{ channelId?: string }>();
  const { setThreadId } = useThread();
  const {
    setOpen: setRightSidebarOpen,
    isMobile,
    setOpenMobile,
  } = useSidebarWithSide("right");
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteChannelMutation = useMutation(
    orpc.channel.delete.mutationOptions({
      onSuccess: (deletedChannel) => {
        const isActive = channelId === channel.id;

        queryClient.removeQueries({
          queryKey: conversationKey({
            kind: "channel",
            channelId: channel.id,
          }),
        });
        void queryClient.invalidateQueries({
          queryKey: orpc.channel.list.key({ type: "query" }),
        });

        if (isActive) {
          setThreadId(null);
          if (isMobile) {
            setOpenMobile(false);
          } else {
            setRightSidebarOpen(false);
          }
          router.push(`/organizations/${deletedChannel.organizationId}`);
        }

        setOpen(false);
        toast.success("Channel deleted");
      },
      onError: (error) => {
        toast.error("Failed to delete channel", {
          description: error.message,
        });
      },
    })
  );

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (deleteChannelMutation.isPending) return;
        setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        {children ?? (
          <Button
            className={cn(className)}
            variant="destructive"
            size="sm"
            type="button"
          >
            <Trash2 className="size-4" /> Delete channel
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete channel</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes{" "}
            <span className="font-medium text-foreground font-mono">
              #{channel.name}
            </span>{" "}
            and all of its messages and replies. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            type="button"
            disabled={deleteChannelMutation.isPending}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            className={buttonVariants({ variant: "destructive" })}
            disabled={deleteChannelMutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              deleteChannelMutation.mutate({ channelId: channel.id });
            }}
          >
            {deleteChannelMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete channel"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
