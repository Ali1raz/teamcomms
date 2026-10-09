"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useRealtimeTeam } from "@/components/team-realtime-provider";
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
import { orpc } from "@/lib/orpc";
import type { InfiniteMessages } from "./message-item";

interface DeleteMessageDialogProps {
  messageId: string;
  children?: React.ReactNode;
}

export function DeleteMessageDialog({
  messageId,
  children,
}: DeleteMessageDialogProps) {
  const { teamId } = useParams<{ teamId: string }>();
  const queryClient = useQueryClient();
  const { send } = useRealtimeTeam();
  const [open, setOpen] = useState(false);

  // Must stay in sync with the key used in MessageList and EditMessageForm.
  const messageListKey = ["message.list", teamId];

  const deleteMessageMutation = useMutation(
    orpc.message.delete.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any in-flight refetches to avoid race conditions.
        await queryClient.cancelQueries({ queryKey: messageListKey });

        // Snapshot the current cache so we can roll back on error.
        const prevData =
          queryClient.getQueryData<InfiniteMessages>(messageListKey);

        // Optimistically remove the message from the cache immediately.
        queryClient.setQueryData<InfiniteMessages>(messageListKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.filter(
                (msg) => msg.id !== variables.messageId
              ),
            })),
          };
        });

        return { prevData };
      },

      onSuccess: (_data, variables) => {
        send({
          type: "message:deleted",
          payload: { messageId: variables.messageId },
        });
        toast.success("Message deleted");
        setOpen(false);
      },

      onError: (error, _variables, context) => {
        // Roll back the optimistic removal on failure.
        if (context?.prevData) {
          queryClient.setQueryData(messageListKey, context.prevData);
        }
        toast.error("Failed to delete message", {
          description: error.message,
        });
      },

      onSettled: () => {
        // Re-sync with the server once the mutation settles.
        queryClient.invalidateQueries({ queryKey: messageListKey });
      },
    })
  );

  function handleConfirm() {
    deleteMessageMutation.mutate({ messageId });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Message</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this message? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          {/* Cancel — dismiss without doing anything */}
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={deleteMessageMutation.isPending}
            >
              Cancel
            </Button>
          </DialogClose>

          {/* Destructive confirm button */}
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMessageMutation.isPending}
          >
            {deleteMessageMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
