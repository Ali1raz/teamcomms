"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import { type ReactNode, useEffect, useRef } from "react";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerTrigger,
} from "@/components/reui/emoji-picker";
import { cn } from "@/lib/utils";
import { baseExtensions } from "./extensions";
import { Menubar } from "./menubar";

interface iAppProps {
  field: {
    value: string;
    onChange: (value: string) => void;
  } | null;
  sendButton: ReactNode;
  footerLeft?: ReactNode;
  onSubmit?: () => void;
}

export function Editor({ field, sendButton, footerLeft, onSubmit }: iAppProps) {
  const editorDomRef = useRef<HTMLElement | null>(null);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const editor = useEditor({
    extensions: baseExtensions,
    content: (() => {
      if (!field?.value) {
        return "";
      }
      try {
        return JSON.parse(field.value);
      } catch {
        return "";
      }
    })(),
    onUpdate: ({ editor }) => {
      if (field?.onChange) {
        field.onChange(JSON.stringify(editor.getJSON()));
      }
    },
    editorProps: {
      attributes: {
        class:
          "max-w-none wrap-break-word sm:min-h-[125px] max-sm:h-[70px] focus:h-[100px] focus:outline-none prose prose-sm sm:prose lg:prose-lg marker:text-primary dark:prose-invert",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          onSubmitRef.current?.();
          return true;
        }

        return false;
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    editorDomRef.current = editor?.view.dom ?? null;
  }, [editor]);

  useEffect(() => {
    if (!editor || !field) {
      return;
    }

    // Keep the Tiptap instance aligned with form resets and edit defaults,
    // because React Hook Form can update after the editor has already mounted.
    const nextContent = field.value
      ? (() => {
          try {
            return JSON.parse(field.value);
          } catch {
            return "";
          }
        })()
      : "";

    if (field.value) {
      const currentValue = JSON.stringify(editor.getJSON());
      if (currentValue === field.value) {
        return;
      }
    } else if (editor.isEmpty) {
      return;
    }

    editor.commands.setContent(nextContent);
  }, [editor, field]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative flex w-full min-w-0 flex-col overflow-hidden rounded-md border border-input dark:bg-input/30">
      <Menubar editor={editor} />
      <EditorContent
        editor={editor}
        className="max-h-50 overflow-y-auto overflow-x-hidden p-4"
      />
      <div className="p-4 py-2 border-t flex items-end justify-between bg-card">
        {footerLeft}
        <div
          className={cn(
            "flex items-center gap-2 justify-self-end",
            !footerLeft && "ml-auto"
          )}
        >
          <EmojiPicker
            value={null}
            onEmojiSelect={({ value }) => {
              editor.chain().focus().insertContent(value).run();
            }}
          >
            <EmojiPickerTrigger variant="ghost" size="icon-sm" />
            <EmojiPickerContent
              side="bottom"
              align="end"
              returnFocus={editorDomRef}
            />
          </EmojiPicker>
          {sendButton}
        </div>
      </div>
    </div>
  );
}
