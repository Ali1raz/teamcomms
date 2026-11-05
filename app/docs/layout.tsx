import { cn } from "cn";
import type * as PageTree from "fumadocs-core/page-tree";
import { Metadata } from "next";
import { ThemeToggle } from "@/components/general/theme-toggle";
import { DocsLayout } from "@/layouts/docs";
import { Header } from "@/layouts/docs/slots/header";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export const metadata: Metadata = {
  title: {
    template: "%s | TeamComms Docs",
    default: "TeamComms Docs",
  },
};

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      themeSwitch={<ThemeToggle />}
      tree={source.getPageTree()}
      {...baseOptions()}
      slots={{
        header: Header,
      }}
    >
      {children}
    </DocsLayout>
  );
}
