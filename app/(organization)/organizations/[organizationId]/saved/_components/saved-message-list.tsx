"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Bookmark, Loader2, RefreshCcw } from "lucide-react";
import { Route } from "next";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { RenderJSONtoHTML } from "@/components/editor/render-content";
import { UserImage } from "@/components/general/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";
import { formatRelativeTime } from "@/lib/utils";
import { SavedMessageItemType } from "../../../schema";
import {
  toSavedMessageQueryInput,
  useSavedMessageFilters,
} from "../search-params";

export function SavedMessageList({
  organizationId,
}: {
  organizationId: string;
}) {
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useSavedMessageFilters({ startTransition });

  const { data, isFetching, isError, error, refetch } = useQuery({
    ...orpc.organization.savedMessages.list.queryOptions({
      input: toSavedMessageQueryInput(organizationId, filters),
    }),
    placeholderData: keepPreviousData,
  });

  const unsaveMutation = useMutation(
    orpc.message.unsave.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: orpc.organization.savedMessages.list.queryKey({
            input: { organizationId },
          }),
        });
        const previous = queryClient.getQueryData(
          orpc.organization.savedMessages.list.queryKey({
            input: toSavedMessageQueryInput(organizationId, filters),
          })
        );
        queryClient.setQueryData(
          orpc.organization.savedMessages.list.queryKey({
            input: toSavedMessageQueryInput(organizationId, filters),
          }),
          (old: typeof data) =>
            old
              ? {
                  ...old,
                  messages: old.messages.filter(
                    (m: SavedMessageItemType) =>
                      m.message.id !== variables.messageId
                  ),
                  total: Math.max((old.total ?? 1) - 1, 0),
                }
              : old
        );
        return { previous };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.previous) {
          queryClient.setQueryData(
            orpc.organization.savedMessages.list.queryKey({
              input: toSavedMessageQueryInput(organizationId, filters),
            }),
            ctx.previous
          );
        }
        toast.error("Failed to unsave message");
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.organization.savedMessages.list.queryKey({
            input: { organizationId },
          }),
        });
      },
      onSuccess: () => {
        toast.success("Message unsaved");
      },
    })
  );

  const messages = data?.messages ?? [];
  const pageCount = data?.pageCount ?? 1;
  const page = data?.page ?? 1;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-sm text-muted-foreground">
          {error?.message ?? "Failed to load saved messages"}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="size-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {isFetching && messages.length === 0 ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Bookmark className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No saved messages yet.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((item) => {
            const conv = item.message.conversation;
            const href = `/organizations/${organizationId}/${conv.kind === "team" ? "team" : "channel"}/${conv.id}?messageId=${item.message.id}`;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserImage
                      image={item.message.user.image}
                      name={item.message.user.name}
                      className="size-8"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {item.message.user.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.message.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      unsaveMutation.mutate({
                        organizationId,
                        messageId: item.message.id,
                      })
                    }
                    // disabled={unsaveMutation.isPending}
                    aria-label="Unsave message"
                  >
                    {/*{unsaveMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (*/}
                    <Bookmark className="size-4 fill-current" />
                    {/*)}*/}
                  </Button>
                </div>
                <div className="text-sm">
                  <RenderJSONtoHTML
                    content={JSON.parse(item.message.content)}
                    className="text-sm wrap-break-word prose dark:prose-invert leading-relaxed max-w-none w-full marker:text-primary"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Link href={href as Route} className="hover:underline">
                    {conv.kind === "team" ? "Team" : "Channel"}: {conv.name}
                  </Link>
                  <span>Saved {formatRelativeTime(item.savedAt)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setFilters({ page: page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount || isFetching}
            onClick={() => setFilters({ page: page + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
