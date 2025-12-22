import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import InputColor from "@/components/ui/input-color";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";
import { Plus, X } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface Tag {
  _id: Id<"tags">;
  name: string;
  color: string;
  emoji: string;
}

interface NoteTagsSectionProps {
  tags: Tag[];
  selectedTagIds: Id<"tags">[];
  onToggleTag: (tagId: Id<"tags">) => void;
  onCreateTag: (name: string, color: string, emoji: string) => Promise<Id<"tags">>;
}

export function NoteTagsSection({
  tags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
}: NoteTagsSectionProps) {
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [newTagEmoji, setNewTagEmoji] = useState("🏷️");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await onCreateTag(newTagName.trim(), newTagColor, newTagEmoji);
    setNewTagName("");
    setNewTagColor("#3b82f6");
    setNewTagEmoji("🏷️");
    setShowNewTag(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label className="text-sm text-muted-foreground">Tags</Label>
      {tags.map((tag) => (
        <Badge
          key={tag._id}
          variant={selectedTagIds.includes(tag._id) ? "default" : "outline"}
          className="cursor-pointer"
          style={
            selectedTagIds.includes(tag._id)
              ? { backgroundColor: tag.color, borderColor: tag.color }
              : { borderColor: tag.color, color: tag.color }
          }
          onClick={() => onToggleTag(tag._id)}
        >
          <span className="mr-1">{tag.emoji}</span>
          {tag.name}
          {selectedTagIds.includes(tag._id) && (
            <X className="w-3 h-3 ml-1" />
          )}
        </Badge>
      ))}
      <Popover open={showNewTag} onOpenChange={setShowNewTag}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" type="button">
            <Plus className="w-3 h-3 mr-1" />
            New Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Create New Tag</h4>
            <div className="space-y-2">
              <Label htmlFor="noteTagName">Name</Label>
              <Input
                id="noteTagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Work"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noteTagEmoji">Emoji</Label>
              <Popover
                open={emojiPickerOpen}
                onOpenChange={setEmojiPickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <span className="text-2xl mr-2">{newTagEmoji}</span>
                    Choose emoji
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <EmojiPicker
                    onEmojiSelect={(emoji) => {
                      setNewTagEmoji(emoji.emoji);
                      setEmojiPickerOpen(false);
                    }}
                  >
                    <EmojiPickerSearch placeholder="Search emoji..." />
                    <EmojiPickerContent className="h-[300px]" />
                    <EmojiPickerFooter />
                  </EmojiPicker>
                </PopoverContent>
              </Popover>
            </div>
            <InputColor
              label="Color"
              value={newTagColor}
              onChange={setNewTagColor}
              onBlur={() => {}}
              className="mt-0"
            />
            <Button
              onClick={handleCreateTag}
              className="w-full"
              type="button"
              disabled={!newTagName.trim()}
            >
              Create Tag
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

