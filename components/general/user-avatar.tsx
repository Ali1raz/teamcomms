import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
export function UserImage({
  image,
  name,
  className,
  isOnline = false,
  showOnline = false,
}: {
  image?: string | null;
  name?: string | null;
  className?: string;
  isOnline?: boolean;
  showOnline?: boolean;
}) {
  const imageUrl = image || `https://avatar.vercel.sh/${name?.trim() || "U"}`;

  return (
    <div className="relative">
      <Avatar className={cn(className)}>
        <AvatarImage src={imageUrl} alt="Profile image" />
        <AvatarFallback>
          {name && name.length > 0 ? name[0] : "U"}
        </AvatarFallback>
      </Avatar>
      {showOnline && (
        <div
          className={cn(
            "size-3 border-2 border-background rounded-full absolute bottom-0 right-0",
            isOnline ? "bg-green-500" : "bg-gray-500"
          )}
        />
      )}
    </div>
  );
}
