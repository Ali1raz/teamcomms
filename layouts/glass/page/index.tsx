"use client";

import { TOCItemType } from "fumadocs-core/toc";
import { Edit } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  use,
  useEffect,
  useState,
} from "react";
import { buttonVariants } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { Breadcrumb } from "./slots/breadcrumb";
import { Footer } from "./slots/footer";
import { TOC, type TOCProps, TOCProvider } from "./slots/toc";

export interface DocsPageProps extends ComponentProps<"article"> {
  toc?: TOCItemType[];

  /**
   * Extend the page to fill all available space
   *
   * @defaultValue false
   */
  full?: boolean | undefined;

  tableOfContent?: TOCProps;
}

const PageContext = createContext<{
  full: boolean;
} | null>(null);

export function useDocsPage() {
  const context = use(PageContext);
  if (!context)
    throw new Error(
      "Please use page components under <DocsPage /> (`fumadocs-ui/layouts/glass/page`)."
    );
  return context;
}

const Empty: never[] = [];

export function DocsPage({
  full = false,
  toc = Empty,
  tableOfContent,
  children,
}: DocsPageProps) {
  return (
    <PageContext
      value={{
        full,
      }}
    >
      <TOCProvider toc={toc}>
        <div
          data-fd-full={full}
          className={cn(
            "flex flex-col gap-2 p-6 pb-16 min-w-0 [grid-area:main] md:pt-16 md:pb-8",
            full && "layout:[--fd-main-width:1200px]"
          )}
        >
          <Breadcrumb />
          {children}
          <Footer />
        </div>
        <TOC {...tableOfContent} />
      </TOCProvider>
    </PageContext>
  );
}

export function EditOnGitHub(props: ComponentProps<"a">) {
  return (
    <a
      target="_blank"
      rel="noreferrer noopener"
      {...props}
      className={cn(
        buttonVariants({
          variant: "secondary",
          size: "sm",
        }),
        "gap-1.5 not-prose",
        props.className
      )}
    >
      {props.children ?? (
        <>
          <Edit className="size-3.5" />
          Edit on GitHub
        </>
      )}
    </a>
  );
}

/**
 * Add typography styles
 */
export function DocsBody({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div {...props} className={cn("prose dark:prose-invert flex-1", className)}>
      {children}
    </div>
  );
}

export function DocsDescription({
  children,
  className,
  ...props
}: ComponentProps<"p">) {
  // Don't render if no description provided
  if (children === undefined) return null;

  return (
    <p
      {...props}
      className={cn("mb-8 text-lg text-fd-muted-foreground", className)}
    >
      {children}
    </p>
  );
}

export function DocsTitle({
  children,
  className,
  ...props
}: ComponentProps<"h1">) {
  return (
    <h1 {...props} className={cn("text-[1.75em] font-semibold", className)}>
      {children}
    </h1>
  );
}

export function PageLastUpdate({
  date: value,
  ...props
}: Omit<ComponentProps<"p">, "children"> & { date: Date }) {
  const [date, setDate] = useState("");

  useEffect(() => {
    // to the timezone of client
    setDate(value.toLocaleDateString());
  }, [value]);

  return (
    <p {...props} className={cn("text-sm", props.className)}>
      Last updated on {date}
    </p>
  );
}

export {
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "../../../components/ai/page-actions";
