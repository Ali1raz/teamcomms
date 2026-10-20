"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLLAPSED_HEIGHT = 240;
const COLLAPSED_TOLERANCE = 8;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ExpandableContent({ children }: { children: ReactNode }) {
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsible, setIsCollapsible] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const measure = () => {
      const collapsible =
        content.scrollHeight > COLLAPSED_HEIGHT + COLLAPSED_TOLERANCE;
      setIsCollapsible(collapsible);
      if (!collapsible) {
        setIsExpanded(false);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        id={contentId}
        ref={contentRef}
        className={cn(
          isCollapsible &&
            !isExpanded &&
            "max-h-60 overflow-hidden mask-[linear-gradient(to_bottom,black_calc(100%_-_2.5rem),transparent)]"
        )}
      >
        {children}
      </div>

      {isCollapsible && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="self-start cursor-pointer"
          aria-controls={contentId}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
          {isExpanded ? (
            <ChevronUp data-icon="inline-end" />
          ) : (
            <ChevronDown data-icon="inline-end" />
          )}
        </Button>
      )}
    </>
  );
}
