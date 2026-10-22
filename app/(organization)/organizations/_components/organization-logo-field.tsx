"use client";

import { OrganizationAvatar } from "@/components/general/organization-avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { isOrganizationColor } from "@/lib/utils";
import { AttachmentChip } from "../[organizationId]/_components/attachment-chip";
import { ImageUploadDialog } from "../[organizationId]/_components/image-dialog";

export function OrganizationLogoField({
  organizationId,
  value,
  onChange,
  disabled,
}: {
  organizationId?: string;
  value?: string | null;
  onChange: (logo: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <Field>
      <FieldLabel>Logo</FieldLabel>
      <div className="flex items-end gap-3">
        {value && !isOrganizationColor(value) ? (
          <AttachmentChip
            url={value}
            onDelete={() => onChange(null)}
            onChangeComplete={onChange}
          />
        ) : (
          <>
            {organizationId ? (
              <OrganizationAvatar
                organization={{ id: organizationId, name: "", logo: value }}
                className="size-24"
              />
            ) : null}
            <ImageUploadDialog onUploadComplete={onChange}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
              >
                Upload Logo
              </Button>
            </ImageUploadDialog>
          </>
        )}
      </div>
      <FieldDescription>
        Optional. Without a logo, the organization shows a color.
      </FieldDescription>
    </Field>
  );
}
