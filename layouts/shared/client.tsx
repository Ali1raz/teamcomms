"use client";
import {
  type BaseLayoutProps,
  isLinkItemActive,
  type LinkItemType,
} from "@fumadocs/base-ui/layouts/shared";
import { usePathname } from "fumadocs-core/framework";
import Link from "fumadocs-core/link";
import { type ComponentProps, type FC, type ReactNode, useState } from "react";
import { cn } from "../../lib/utils";

import {
  FullSearchTrigger,
  type FullSearchTriggerProps,
  SearchTrigger,
  type SearchTriggerProps,
} from "./slots/search-trigger";
import { ThemeSwitch, type ThemeSwitchProps } from "./slots/theme-switch";

export function LinkItem({
  ref,
  item,
  ...props
}: Omit<ComponentProps<"a">, "href"> & {
  item: Extract<LinkItemType, { url: string }>;
}) {
  const pathname = usePathname();
  const active = isLinkItemActive(item, pathname);

  return (
    <Link
      ref={ref}
      href={item.url}
      external={item.external}
      {...props}
      data-active={active}
    >
      {props.children}
    </Link>
  );
}

/**
 * The place of AI chat, docked by the layout on wide viewports, and floating on smaller ones.
 */
export function AIChatPanel({
  open,
  className,
  children,
}: {
  open: boolean;
  className?: string;
  children: ReactNode;
}) {
  // mount the chat once opened
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  return (
    <aside
      className={cn(
        "z-40 overflow-clip bg-fd-card text-fd-card-foreground layout:[--fd-ai-chat-width:min(--spacing(100),100vw---spacing(4))] transition-[width,margin,translate] duration-300 ease-in-out motion-reduce:transition-none max-xl:fixed max-xl:inset-y-2 max-xl:end-2 max-xl:w-(--fd-ai-chat-width) max-xl:rounded-2xl max-xl:border max-xl:shadow-xl",
        open
          ? "w-(--fd-ai-chat-width)"
          : // visible at once when opened, so it can take focus; hidden only after closing
            "invisible w-0 transition-[width,margin,translate,visibility] max-xl:translate-x-[calc(100%+--spacing(2))] rtl:max-xl:-translate-x-[calc(100%+--spacing(2))]",
        className
      )}
    >
      {/* fixed width while resizing */}
      <div className="flex flex-col size-full xl:w-(--fd-ai-chat-width)">
        {mounted && children}
      </div>
    </aside>
  );
}

export interface BaseSlots {
  navTitle: FC<ComponentProps<"a">>;
  themeSwitch: FC<ThemeSwitchProps> | false;
  searchTrigger:
    | {
        sm: FC<SearchTriggerProps>;
        full: FC<FullSearchTriggerProps>;
      }
    | false;
}

export interface BaseSlotsProps<P extends BaseLayoutProps = BaseLayoutProps>
  extends Pick<P, "nav"> {
  themeSwitch: Omit<NonNullable<P["themeSwitch"]>, "enabled">;
  searchToggle: Omit<NonNullable<P["searchToggle"]>, "enabled">;
}

export function baseSlots({ useProps }: { useProps: () => BaseSlotsProps }) {
  function InlineThemeSwitch(props: ThemeSwitchProps) {
    const { themeSwitch } = useProps();
    if (themeSwitch.component) return themeSwitch.component;
    return <ThemeSwitch {...props} {...themeSwitch} />;
  }

  function InlineSearchTrigger(props: SearchTriggerProps) {
    const { searchToggle } = useProps();
    if (searchToggle.components?.sm) return searchToggle.components.sm;
    return <SearchTrigger {...props} {...searchToggle.sm} />;
  }

  function InlineSearchTriggerFull(props: FullSearchTriggerProps) {
    const { searchToggle } = useProps();
    if (searchToggle.components?.lg) return searchToggle.components.lg;
    return <FullSearchTrigger {...props} {...searchToggle.full} />;
  }

  function InlineNavTitle({
    href: defaultUrl = "/",
    ...props
  }: ComponentProps<"a">) {
    const { url = defaultUrl, title } = useProps().nav ?? {};

    if (typeof title === "function") return title({ href: url, ...props });
    return (
      <Link href={url} {...props}>
        {title}
      </Link>
    );
  }

  return {
    useBaseSlots(options: BaseLayoutProps): {
      baseSlots: BaseSlots;
      baseProps: BaseSlotsProps;
    } {
      const {
        nav,
        slots = {},
        searchToggle: {
          enabled: searchToggleEnabled = true,
          ...searchToggle
        } = {},
        themeSwitch: {
          enabled: themeSwitchEnabled = true,
          ...themeSwitch
        } = {},
      } = options;

      return {
        baseSlots: {
          navTitle: slots.navTitle ?? InlineNavTitle,
          themeSwitch:
            themeSwitchEnabled && (slots.themeSwitch ?? InlineThemeSwitch),

          searchTrigger:
            searchToggleEnabled &&
            (slots.searchTrigger ?? {
              sm: InlineSearchTrigger,
              full: InlineSearchTriggerFull,
            }),
        },
        baseProps: {
          nav,
          searchToggle,
          themeSwitch,
        },
      };
    },
  };
}
