"use client";
import { Eye } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUploadDialog } from "./image-dialog";

interface iAppProps {
  url: string;
  onDelete: () => void;
  onChangeComplete: (newUrl: string) => void;
}

export function AttachmentChip({ url, onDelete, onChangeComplete }: iAppProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="group relative size-20 overflow-hidden rounded bg-muted">
          <Image src={url} alt="uploaded image" fill className="object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
            <Eye className="size-4 text-foreground" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Attachment Preview</DialogTitle>
          <DialogDescription>
            Preview the attached file or change/delete it before sending the
            message.
          </DialogDescription>
        </DialogHeader>
        <div className="relative h-75 overflow-hidden rounded-lg bg-muted">
          <Image
            src={url}
            alt="attachment preview"
            fill
            className="object-contain"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <div className="space-x-2 ml-auto">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete();
              }}
            >
              Delete
            </Button>

            <ImageUploadDialog
              onUploadComplete={(newUrl) => {
                onChangeComplete(newUrl);
                setOpen(false);
              }}
            >
              <Button type="button">Change</Button>
            </ImageUploadDialog>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
