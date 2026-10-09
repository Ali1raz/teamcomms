"use client";

import { Upload } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadDropzone } from "@/lib/uploadthing";

export function ImageUploadDialog({
  children,
  onUploadComplete,
}: {
  children?: ReactNode;
  onUploadComplete?: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <Upload className="size-4" />
            <span>Upload Image</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
          <DialogDescription>
            Choose an image or drag and drop it here to upload.
          </DialogDescription>
        </DialogHeader>
        <UploadDropzone
          endpoint={"imageUploader"}
          onClientUploadComplete={(res) => {
            const url = res[0].ufsUrl;
            onUploadComplete?.(url);
            toast.success("File uploaded successfully!");
            setOpen(false);
          }}
          onUploadError={(error) => {
            toast.error("Error uploading file!", {
              description: error.message ?? null,
            });
          }}
          className="ut-uploading:opacity-90 ut-ready:bg-card ut-ready:border-border ut-ready:text-foreground ut-uploading:bg-muted ut-uploading:border-border ut-uploading:text-muted-foreground ut-label:text-sm ut-label:text-muted-foreground ut-allowed-content:text-xs ut-allowed-content:text-muted-foreground ut-button:bg-primary ut-button:text-primary-foreground ut-button:rounded border-dashed border-2 ut-readying:border-primary"
          appearance={{
            container: "bg-card",
            label: "text-muted-foreground hover:text-primary",
            allowedContent: "text-muted-foreground text-sm",
            button:
              "bg-primary text-primary-foreground rounded hover:bg-primary/90 hover:cursor-pointer",
            uploadIcon: "text-muted-foreground",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
