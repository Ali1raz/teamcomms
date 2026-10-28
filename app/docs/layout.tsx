import { ThemeToggle } from "@/components/general/theme-toggle";
import { DocsLayout } from "@/layouts/docs";
import { Header } from "@/layouts/docs/slots/header";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

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
