import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsAttribution } from "@/components/docs-attribution";
import { getMDXComponents } from "@/components/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/layouts/docs/page";
import { SITE } from "@/lib/app/site";
import { getPageImage, source } from "@/lib/source";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle className="font-semibold text-4xl tracking-[-0.03em]">
        {page.data.title}
      </DocsTitle>
      <DocsDescription className="max-w-[62ch] text-black/60 text-lg leading-relaxed dark:text-white/60">
        {page.data.description}
      </DocsDescription>
      <div className="border-b pb-6">
        {page.data.lastModified && (
          <span className="text-muted-foreground text-sm">
            Last modified: {page.data.lastModified.toLocaleDateString()}
          </span>
        )}
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      <DocsAttribution />
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: `${SITE.url}${page.url}`,
    },
    openGraph: {
      title: `${page.data.title} | ${SITE.name}`,
      description: page.data.description,
      url: page.url,
      siteName: SITE.name,
      type: "article",
      locale: "en_US",
      images: getPageImage(page).url,
    },
  };
}
