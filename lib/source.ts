import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/plugins/lucide-icons";
import { defineDocs } from "fumadocs-mdx/macro";
import { docsContentRoute, docsImageRoute, docsRoute } from "@/lib/shared";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    lastModified: true,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

type DocsPage = ReturnType<typeof source.getPages>[number];

export function getPageImage(page: DocsPage) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join("/")}`,
  };
}

export function getPageMarkdownUrl(page: DocsPage) {
  const segments = [...page.slugs, "content.md"];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join("/")}`,
  };
}

export async function getLLMText(page: DocsPage) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
