"use client";

import { SmilePlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const QUICK_REACTIONS = [
  { emoji: "👍", label: "Thumbs up" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "😂", label: "Laughing" },
  { emoji: "🎉", label: "Party popper" },
  { emoji: "😮", label: "Surprised" },
  { emoji: "😢", label: "Sad" },
  { emoji: "🙏", label: "Thanks" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "👀", label: "Eyes" },
  { emoji: "✅", label: "Done" },
] as const;

interface ReactionEmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function ReactionEmojiPicker({ onSelect }: ReactionEmojiPickerProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(emoji: string) {
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
      <PopoverContent align="start" className="w-fit p-2">
        <div className="grid grid-cols-5 gap-1">
          {QUICK_REACTIONS.map(({ emoji, label }) => (
            <Button
              key={emoji}
              type="button"
              variant="ghost"
              size="icon"
              title={label}
              onClick={() => handleSelect(emoji)}
            >
              {emoji}
              <span className="sr-only">{label}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
