import { Header } from "@/layouts/docs/slots/header";
import { DocsLayout } from "@/layouts/glass";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
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
