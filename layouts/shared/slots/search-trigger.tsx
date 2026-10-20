"use client";
import { Dialog } from "@base-ui/react/dialog";
import { useSearchContext } from "@fumadocs/base-ui/contexts/search";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { type ButtonProps, buttonVariants } from "@/components/ui/button";
import { cn } from "../../../lib/utils";

export interface SearchTriggerProps
  extends Omit<ComponentProps<"button">, "color">,
    ButtonProps {
  hideIfDisabled?: boolean;
}

export function SearchTrigger({
  hideIfDisabled,
  size = "icon-sm",
  color,
  variant = "ghost",
  ...props
}: SearchTriggerProps) {
  const { enabled, dialogHandle } = useSearchContext();
  if (hideIfDisabled && !enabled) return null;

  return (
    <Dialog.Trigger
      handle={dialogHandle}
      type="button"
      className={cn(
        buttonVariants({
          size,
          variant,
        }),
        props.className
      )}
      data-search=""
      aria-label="Open Search"
    >
      <Search />
    </Dialog.Trigger>
  );
}

export interface FullSearchTriggerProps extends ComponentProps<"button"> {
  hideIfDisabled?: boolean;
}

export function FullSearchTrigger({
  hideIfDisabled,
  ...props
}: FullSearchTriggerProps) {
  const { enabled, hotKey, dialogHandle } = useSearchContext();
  if (hideIfDisabled && !enabled) return null;

  return (
    <Dialog.Trigger
      handle={dialogHandle}
      type="button"
      data-search-full=""
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border bg-fd-secondary/50 p-1.5 ps-2 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground",
        props.className
      )}
    >
      <Search className="size-4" />
      Search
      <div className="ms-auto inline-flex gap-0.5">
        {hotKey.map((k, i) => (
          <kbd key={i} className="rounded-md border bg-fd-background px-1.5">
            {k.display}
          </kbd>
        ))}
      </div>
    </Dialog.Trigger>
  );
}
