import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  mediaClassName?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
  mediaClassName,
  iconClassName,
  titleClassName,
  descriptionClassName,
}: EmptyStateProps) {
  return (
    <Empty className={cn("h-full bg-muted/40", className)}>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia
            variant="icon"
            className={cn("size-28 rounded-full bg-muted", mediaClassName)}
          >
            <Icon className={cn("size-14", iconClassName)} />
          </EmptyMedia>
        )}
        <EmptyTitle
          className={cn("mt-4 text-2xl sm:mt-6 sm:text-4xl", titleClassName)}
        >
          {title}
        </EmptyTitle>
        {description && (
          <EmptyDescription
            className={cn(
              "w-sm text-xs sm:w-xl sm:text-lg",
              descriptionClassName
            )}
          >
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>
      {action && <EmptyContent className="mt-4">{action}</EmptyContent>}
    </Empty>
  );
}
