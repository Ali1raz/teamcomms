import Blockquote from "@tiptap/extension-blockquote";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";
import { all, createLowlight } from "lowlight";

const lowlight = createLowlight(all);

export const extensions = [
  StarterKit.configure({
    codeBlock: false,
    blockquote: false,
    link: {
      openOnClick: false,
      linkOnPaste: true,
      defaultProtocol: "https",
      protocols: [
        "https",
        "mailto",
        {
          scheme: "tel",
          optionalSlashes: true,
        },
      ],
      autolink: true,
      HTMLAttributes: {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
        class: "text-primary underline cursor-pointer hover:text-primary/80",
      },
    },
    undoRedo: {
      depth: 10,
    },
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  CodeBlockLowlight.configure({
    lowlight,
    exitOnTripleEnter: true,
    enableTabIndentation: true,
    tabSize: 2,
    exitOnArrowDown: false,
  }),
  Blockquote.configure({
    HTMLAttributes: {
      class: "border-l-4 pl-4 italic text-muted-foreground",
    },
  }),
  Details.configure({
    persist: true,
    HTMLAttributes: {
      class: "message-details",
    },
  }),
  DetailsSummary.configure({
    HTMLAttributes: {
      class: "message-details-summary",
    },
  }),
  DetailsContent.configure({
    HTMLAttributes: {
      class: "message-details-content",
    },
  }),
];

export const baseExtensions = [
  ...extensions,
  Placeholder.configure({
    placeholder: "Type a message...",
  }),
];
