import { type Editor, useEditorState } from "@tiptap/react";
import {
  Bold,
  ChevronsUpDown,
  Code,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { markdownToJson } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Toggle } from "../ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ComposeButton } from "./compose-button";

interface iAppProps {
  editor: Editor | null;
}

export function Menubar({ editor }: iAppProps) {
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return null;
      }
      return {
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isStrike: editor.isActive("strike"),
        CodeBlockLowlight: editor.isActive("codeBlock"),
        // Track blockquote active state for the toggle button
        isBlockquote: editor.isActive("blockquote"),
        isDetails: editor.isActive("details"),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        canUndo: editor.can().chain().focus().undo().run(),
        canRedo: editor.can().chain().focus().redo().run(),
        currentContent: editor.getJSON(),
      };
    },
  });

  function handleAccept(markdown: string) {
    try {
      const json = markdownToJson(markdown);
      editor?.commands.setContent(json);
    } catch {
      console.log("something went wrong");
    }
  }

  const [detailsPopoverOpen, setDetailsPopoverOpen] = useState(false);
  const [detailsTitle, setDetailsTitle] = useState("");

  function handleDetailsClick() {
    if (!editor || editor.isActive("details")) {
      editor?.chain().focus().unsetDetails().run();
      return;
    }
    setDetailsPopoverOpen(true);
  }

  function insertDetails() {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "details",
        attrs: { open: true },
        content: [
          {
            type: "detailsSummary",
            content: detailsTitle ? [{ type: "text", text: detailsTitle }] : [],
          },
          {
            type: "detailsContent",
            content: [{ type: "paragraph" }],
          },
        ],
      })
      .run();
    setDetailsTitle("");
    setDetailsPopoverOpen(false);
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-1 sm:p-2 bg-card border-input border-b rounded-t-md p-2">
      <div className="flex gap-1 items-center flex-wrap">
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={editorState?.isBold ?? false}
              onPressedChange={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bold</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={editorState?.isItalic ?? false}
              onPressedChange={() =>
                editor?.chain().focus().toggleItalic().run()
              }
            >
              <Italic />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Italic</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={editorState?.isStrike ?? false}
              onPressedChange={() =>
                editor?.chain().focus().toggleStrike().run()
              }
            >
              <Strikethrough />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Strike</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={editorState?.CodeBlockLowlight ?? false}
              onPressedChange={() =>
                editor?.chain().focus().toggleCodeBlock().run()
              }
            >
              <Code />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Code Block</p>
          </TooltipContent>
        </Tooltip>

        {/* Blockquote toggle — uses the Blockquote extension already registered in extensions.ts */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={editorState?.isBlockquote ?? false}
              onPressedChange={() =>
                editor?.chain().focus().toggleBlockquote().run()
              }
            >
              <Quote />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Blockquote</p>
          </TooltipContent>
        </Tooltip>

        <Popover
          open={detailsPopoverOpen}
          onOpenChange={(open) => {
            setDetailsPopoverOpen(open);
            if (!open) setDetailsTitle("");
          }}
        >
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={editorState?.isDetails ?? false}
              onPressedChange={handleDetailsClick}
              aria-label="Details block"
            >
              <ChevronsUpDown />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <Input
              autoFocus
              placeholder="Summary title"
              value={detailsTitle}
              onChange={(e) => setDetailsTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertDetails();
                }
              }}
            />
            <Button size="sm" className="w-full" onClick={insertDetails}>
              Insert
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <Separator
        orientation="vertical"
        className="data-vertical:h-4 data-vertical:self-auto"
      />

      <div className="flex gap-1 items-center flex-wrap">
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={editorState?.bulletList ?? false}
              onPressedChange={() =>
                editor?.chain().focus().toggleBulletList().run()
              }
            >
              <List />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bullet List</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={editorState?.orderedList ?? false}
              onPressedChange={() =>
                editor?.chain().focus().toggleOrderedList().run()
              }
            >
              <ListOrdered />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ordered List</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator
        orientation="vertical"
        className="data-vertical:h-4 data-vertical:self-auto"
      />

      <div className="flex gap-1 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              disabled={!editorState?.canUndo}
              onClick={() => editor?.chain().focus().undo().run()}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              disabled={!editorState?.canRedo}
              onClick={() => editor?.chain().focus().redo().run()}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="ml-auto">
        <ComposeButton
          onAccept={handleAccept}
          content={JSON.stringify(editorState?.currentContent)}
        />
      </div>
    </div>
  );
}
