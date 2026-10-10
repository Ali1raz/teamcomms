"use client";

import { SmilePlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ReactionEmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function ReactionEmojiPicker({ onSelect }: ReactionEmojiPickerProps) {
  const [open, setOpen] = useState(false);

  function handleEmojiSelect({ emoji }: { emoji: string }) {
    onSelect(emoji);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm">
          <SmilePlus className="size-4" />
          <span className="sr-only">Add reaction</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-fit p-0">
        <EmojiPicker className="h-75" onEmojiSelect={handleEmojiSelect}>
          <EmojiPickerSearch />
          <EmojiPickerContent />
          <EmojiPickerFooter />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  );
}
