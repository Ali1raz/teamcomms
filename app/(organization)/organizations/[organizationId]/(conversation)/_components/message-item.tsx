"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Edit2,
  MessagesSquare,
  MoreVertical,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RenderJSONtoHTML } from "@/components/editor/render-content";
import { ExpandableContent } from "@/components/general/expandable-content";
import { UserImage } from "@/components/general/user-avatar";
import { ImageZoom } from "@/components/kibo-ui/image-zoom";
import { ReactionBar } from "@/components/reaction/reaction-bar";
import { useThread } from "@/components/thread-sidebar/thread-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebarWithSide } from "@/components/ui/sidebar";
import { orpc } from "@/lib/orpc";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { MessageListItemType } from "../../../schema";
import { DeleteMessageDialog } from "./delete-message-dialog";
import { EditMessageForm } from "./edit-message-form";

export function MessageItem({
  message,
  currentUserId,
  onlineUserIds,
  organizationId,
}: {
  message: MessageListItemType;
  currentUserId: string;
  onlineUserIds: Set<string>;
  organizationId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(message.savedByMe ?? false);

  useEffect(() => {
    setSaved(message.savedByMe ?? false);
  }, [message.savedByMe]);

  const queryClient = useQueryClient();

  const saveMutation = useMutation(
    orpc.message.save.mutationOptions({
      onMutate: () => setSaved(true),
      onError: () => {
        setSaved(false);
        toast.error("Failed to save message");
      },
      onSuccess: () => {
        toast.success("Message saved");
        queryClient.invalidateQueries({
          queryKey: orpc.organization.savedMessages.list.queryKey({
            input: { organizationId },
          }),
        });
      },
    })
  );
  const unsaveMutation = useMutation(
    orpc.message.unsave.mutationOptions({
      onMutate: () => setSaved(false),
      onError: () => {
        setSaved(true);
        toast.error("Failed to unsave message");
      },
      onSuccess: () => {
        toast.success("Message unsaved");
        queryClient.invalidateQueries({
          queryKey: orpc.organization.savedMessages.list.queryKey({
            input: { organizationId },
          }),
        });
      },
    })
  );

  // Access thread context and right sidebar so the replies button can open the
  // thread panel in the same way the MessagesSquare action button does.
  const { setThreadId, threadId } = useThread();
  const { setOpen, isMobile, setOpenMobile, open } =
    useSidebarWithSide("right");

  /** Opens the right sidebar and loads this message's thread. */
  function openThread() {
    setThreadId(message.id);
    if (isMobile) {
      setOpenMobile(true);
    } else {
      setOpen(true);
    }
  }

  const prefetchThread = useCallback(() => {
    const options = orpc.message.threads.list.queryOptions({
      input: { threadId: message.id },
    });
    queryClient
      .prefetchQuery({ ...options, staleTime: 60_000 })
      .catch(() => {});
  }, [queryClient, message.id]);

  return (
    <div
      className={cn(
        "flex relative group gap-3 items-start overflow-x-hidden hover:bg-muted/30 transition-colors duration-150 p-4 border-b border-border",
        open && message.id === threadId && "bg-info/6 hover:bg-info/8",
        message.mentionedUserIds?.includes(currentUserId) &&
          "border-l-primary border-l-3",
        saved && "border-l-warning! border-l-3"
      )}
    >
      <UserImage
        image={message.user.image}
        name={message.user.name}
        isOnline={!!message.user.id && onlineUserIds.has(message.user.id)}
        showOnline={true}
      />
      <div className="flex w-full min-w-0 flex-col gap-2 *:leading-none">
        <div className="flex gap-2 items-center">
          <p className="font-medium line-clamp-1">{message.user.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {formatRelativeTime(message.createdAt)}
          </p>
        </div>
        {isEditing ? (
          <EditMessageForm
            message={message}
            onCancel={() => setIsEditing(false)}
            onSave={() => setIsEditing(false)}
          />
        ) : (
          <>
            <ExpandableContent>
              <RenderJSONtoHTML
                content={JSON.parse(message.content)}
                className="text-sm wrap-break-word prose dark:prose-invert leading-relaxed max-w-none w-full marker:text-primary"
              />
            </ExpandableContent>

            {message.imageUrl && (
              <ImageZoom>
                <Image
                  src={message.imageUrl}
                  alt="uploaded image"
                  width={512}
                  height={512}
                  className="max-h-75 w-auto max-w-full rounded object-cover"
                />
              </ImageZoom>
            )}

            <div className="flex items-center gap-2">
              <ReactionBar
                messageId={message.id}
                reactions={message.reactions}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1"
                disabled={saveMutation.isPending || unsaveMutation.isPending}
                onClick={() => {
                  if (saved) {
                    unsaveMutation.mutate({
                      organizationId,
                      messageId: message.id,
                    });
                  } else {
                    saveMutation.mutate({
                      organizationId,
                      messageId: message.id,
                    });
                  }
                }}
                aria-label={saved ? "Unsave message" : "Save message"}
              >
                <Bookmark className={cn("size-4", saved && "fill-current")} />
              </Button>
            </div>
            <div className="flex">
              <Button
                type="button"
                variant="ghost"
                onClick={openThread}
                className="flex items-center gap-1"
                onMouseEnter={prefetchThread}
                onFocus={prefetchThread}
              >
                <MessagesSquare className="size-4" />
                {message.repliesCount || 0}{" "}
                {message.repliesCount <= 1 ? "reply" : "replies"}
              </Button>
            </div>
          </>
        )}
      </div>

      <MessageActions
        messageId={message.id}
        onEdit={() => setIsEditing(true)}
        canEdit={message.user.id === currentUserId}
      />
    </div>
  );
}

function MessageActions({
  messageId,
  onEdit,
  canEdit,
}: {
  messageId: string;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const { setThreadId } = useThread();
  const { setOpen, isMobile, setOpenMobile } = useSidebarWithSide("right");
  const [dropdownopen, setDropdownOpen] = useState(false);

  return (
    <DropdownMenu open={dropdownopen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <MoreVertical />
          <span className="sr-only">Message actions</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setThreadId(messageId);
            if (isMobile) {
              setOpenMobile(true);
            } else {
              setOpen(true);
            }
            setDropdownOpen(false);
          }}
        >
          <MessagesSquare />
          Open thread
        </DropdownMenuItem>

        {canEdit && (
          <>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onEdit();
                setDropdownOpen(false);
              }}
            >
              <Edit2 />
              Edit
            </DropdownMenuItem>

            <DeleteMessageDialog messageId={messageId}>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                }}
                variant="destructive"
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DeleteMessageDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
