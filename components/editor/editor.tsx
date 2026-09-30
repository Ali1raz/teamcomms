"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import { baseExtensions } from "./extensions";
import { Menubar } from "./menubar";
import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

interface iAppProps {
  field: {
    value: string;
    onChange: (value: string) => void;
  } | null;
  sendButton: ReactNode;
  footerLeft?: ReactNode;
}

export function Editor({ field, sendButton, footerLeft }: iAppProps) {
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
          "max-w-none sm:min-h-[125px] max-sm:h-[70px] focus:h-[100px] focus:outline-none prose prose-sm sm:prose lg:prose-lg marker:text-primary dark:prose-invert",
      },
    },
    immediatelyRender: false,
  });

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
    <div className="relative w-full border border-input rounded-md overflow-hidden dark:bg-input/30 flex flex-col">
      <Menubar editor={editor} />
      <EditorContent editor={editor} className="p-4 max-h-50 overflow-y-auto" />
      <div className="p-4 py-2 border-t flex items-center justify-between bg-card">
        {footerLeft}
        <div className={cn("justify-self-end", !footerLeft && "ml-auto")}>
          {sendButton}
        </div>
      </div>
    </div>
  );
}
