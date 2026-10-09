import { generateHTML, type JSONContent } from "@tiptap/react";
import Dompurify from "dompurify";
import parse from "html-react-parser";
import { cn } from "@/lib/utils";
import { baseExtensions } from "./extensions";

interface iAppProps {
  content: JSONContent;
  className?: string;
}

export function RenderJSONtoHTML({ content, className }: iAppProps) {
  const html = convertJSONtoHTML(content);

  const cleaned = Dompurify.sanitize(html);

  return <div className={cn("tiptap", className)}>{parse(cleaned)}</div>;
}

function convertJSONtoHTML(jsonContent: JSONContent): string {
  try {
    const content =
      typeof jsonContent === "string" ? JSON.parse(jsonContent) : jsonContent;
    return generateHTML(content, baseExtensions);
  } catch {
    console.log("error converting json to html");
    return "";
  }
}
