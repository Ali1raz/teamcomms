import type { DOMOutputSpec, Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { JSONContent } from "@tiptap/react";
import {
  domOutputSpecToHTMLString,
  renderToHTMLString,
} from "@tiptap/static-renderer/pm/html-string";
import Dompurify from "dompurify";
import parse from "html-react-parser";
import { cn } from "@/lib/utils";
import { baseExtensions, lowlight } from "./extensions";

interface iAppProps {
  content: JSONContent;
  className?: string;
}

interface HighlightNode {
  type: string;
  value?: string;
  properties?: { className?: unknown };
  children?: HighlightNode[];
}

export function RenderJSONtoHTML({ content, className }: iAppProps) {
  const html = convertJSONtoHTML(content);

  const cleaned = Dompurify.sanitize(html);

  return <div className={cn("tiptap", className)}>{parse(cleaned)}</div>;
}

// CodeBlockLowlight applies syntax highlighting through a ProseMirror plugin
// (decorations), which is view-only and never serialized by `renderHTML`.
// Static rendering therefore needs to run lowlight itself and emit the
// `hljs-*` spans that the styles in globals.css target.
function highlightToOutputSpec(nodes: HighlightNode[]): unknown[] {
  return nodes.map((node) => {
    if (node.type === "text") {
      return node.value ?? "";
    }

    const className = node.properties?.className;
    const classes = Array.isArray(className) ? className.join(" ") : className;

    return [
      "span",
      typeof classes === "string" && classes ? { class: classes } : {},
      ...highlightToOutputSpec(node.children ?? []),
    ] as DOMOutputSpec;
  });
}

function renderCodeBlock(node: ProseMirrorNode): string {
  const language = (node.attrs.language as string | null) ?? null;

  const result =
    language && lowlight.registered(language)
      ? lowlight.highlight(language, node.textContent)
      : lowlight.highlightAuto(node.textContent);

  return domOutputSpecToHTMLString([
    "pre",
    [
      "code",
      language ? { class: `language-${language}` } : {},
      ...highlightToOutputSpec(result.children ?? []),
    ],
  ] as DOMOutputSpec)("");
}

function convertJSONtoHTML(jsonContent: JSONContent): string {
  try {
    const content =
      typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;

    return renderToHTMLString({
      content,
      extensions: baseExtensions,
      options: {
        nodeMapping: {
          codeBlock: ({ node }) => renderCodeBlock(node),
        },
      },
    });
  } catch {
    console.log("error converting json to html");
    return "";
  }
}
