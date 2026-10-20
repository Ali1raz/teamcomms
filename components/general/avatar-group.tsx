"use client";

import type { ComponentProps, ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type AvatarGroupItem = {
  id: string;
  name: string;
  image?: string | null;
};

type AvatarSize = NonNullable<ComponentProps<typeof Avatar>["size"]>;

const DEFAULT_MAX_VISIBLE = 3;

export function AvatarGroup({
  items,
  totalCount = items.length,
  maxVisible = DEFAULT_MAX_VISIBLE,
  size = "sm",
  className,
  emptyFallback,
  itemLabel = (item) => item.name,
  overflowLabel = (count) => `${count} more`,
}: {
  items: AvatarGroupItem[];
  totalCount?: number;
  maxVisible?: number;
  size?: AvatarSize;
  className?: string;
  emptyFallback?: ReactNode;
  itemLabel?: (item: AvatarGroupItem) => string;
  overflowLabel?: (count: number) => string;
}) {
  const visibleItems = items.slice(0, maxVisible);
  const hiddenCount = Math.max(totalCount - visibleItems.length, 0);

  if (visibleItems.length === 0 && hiddenCount === 0) {
    return <>{emptyFallback}</>;
  }

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleItems.map((item) => {
        const label = itemLabel(item);
        const initials = item.name.trim().slice(0, 2).toUpperCase();

        return (
          <Tooltip key={item.id}>
            <TooltipTrigger
              aria-label={label}
              className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              type="button"
            >
              <Avatar
                className="ring-2 ring-background transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                size={size}
              >
                <AvatarImage src={item.image ?? undefined} alt="" />
                <AvatarFallback>{initials || "?"}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent sideOffset={10}>{label}</TooltipContent>
          </Tooltip>
        );
      })}
      {hiddenCount > 0 && (
        <Tooltip>
          <TooltipTrigger
            aria-label={overflowLabel(hiddenCount)}
            className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            type="button"
          >
            <Avatar className="ring-2 ring-background" size={size}>
              <AvatarFallback>+{hiddenCount}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent sideOffset={10}>
            {overflowLabel(hiddenCount)}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
