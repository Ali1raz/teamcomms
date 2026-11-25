import Blockquote from "@tiptap/extension-blockquote";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import { Mention } from "@tiptap/extension-mention";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import type { DOMOutputSpec } from "@tiptap/pm/model";
import { StarterKit } from "@tiptap/starter-kit";
import { all, createLowlight } from "lowlight";

export const lowlight = createLowlight(all);

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

export const MentionWithImage = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      image: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-image") ??
          element.querySelector("img")?.getAttribute("src") ??
          null,
        renderHTML: (attributes) => {
          if (!attributes.image) return {};
          return { "data-image": attributes.image };
        },
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const label = node.attrs.label ?? node.attrs.id;
    const image = node.attrs.image;
    const char =
      node.attrs.mentionSuggestionChar &&
      node.attrs.mentionSuggestionChar !== "@"
        ? node.attrs.mentionSuggestionChar
        : "@";
    const children: DOMOutputSpec[] = [];
    if (image) {
      children.push([
        "img",
        {
          src: image,
          alt: label ?? "",
          class: "mention-avatar",
          width: 14,
          height: 14,
        },
      ]);
    }
    children.push([
      "span",
      { class: "mention-label" },
      `${char}${label ?? node.attrs.id}`,
    ]);

    return [
      "span",
      {
        "data-type": this.name,
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
      },
      ...children,
    ];
  },
});

export const baseExtensions = [
  ...extensions,
  MentionWithImage.configure({
    HTMLAttributes: {
      class: "mention",
      "data-type": "mention",
    },
  }),
  Placeholder.configure({
    placeholder: "Type a message...",
  }),
];
