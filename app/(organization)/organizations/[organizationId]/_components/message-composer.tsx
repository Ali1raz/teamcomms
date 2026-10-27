import { ImageIcon, Send } from "lucide-react";
import { useCallback } from "react";
import { Editor } from "@/components/editor/editor";
import type { MentionUser } from "@/components/editor/mentions";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { getShortcutModifierLabel } from "@/lib/utils";
import { AttachmentChip } from "./attachment-chip";
import { ImageUploadDialog } from "./image-dialog";

interface iAppProps {
  field: {
    value: string;
    onChange: (value: string) => void;
  };
  imageUrl: string | null | undefined;
  onImageChange: (url: string | undefined) => void;
  onClearImage?: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  members?: MentionUser[];
}

export function MessageComposer({
  field,
  imageUrl,
  onImageChange,
  onClearImage,
  onSubmit,
  isSubmitting,
  submitLabel = "Send",
  members,
}: iAppProps) {
  const mentionsQuery = useCallback(
    async (query: string) => {
      if (!members?.length) {
        return [];
      }

      const normalizedQuery = query.toLowerCase();
      return members
        .filter(
          (member) =>
            member.name.toLowerCase().includes(normalizedQuery) ||
            (member.email?.toLowerCase().includes(normalizedQuery) ?? false)
        )
        .slice(0, 8);
    },
    [members]
  );

  return (
    <Editor
      field={{ value: field.value, onChange: field.onChange }}
      mentionsQuery={mentionsQuery}
      onSubmit={onSubmit}
      sendButton={
        <Button
          disabled={isSubmitting}
          type="button"
          size="sm"
          onClick={onSubmit}
        >
          <Send data-icon="inline-start" /> {submitLabel}
          <KbdGroup className="hidden sm:flex">
            <Kbd>{getShortcutModifierLabel()}</Kbd>
            <Kbd>↵</Kbd>
          </KbdGroup>
        </Button>
      }
      footerLeft={
        imageUrl ? (
          <AttachmentChip
            url={imageUrl}
            onDelete={() =>
              onClearImage ? onClearImage() : onImageChange(undefined)
            }
            onChangeComplete={(url) => onImageChange(url)}
          />
        ) : (
          <ImageUploadDialog onUploadComplete={(url) => onImageChange(url)}>
            <Button size="sm" variant="outline" type="button">
              <ImageIcon data-icon="inline-start" /> Attach
            </Button>
          </ImageUploadDialog>
        )
      }
    />
  );
}
