import Image from "next/image";
import { cn, getOrganizationColor, isOrganizationColor } from "@/lib/utils";

type OrganizationAvatarOrganization = {
  id: string;
  name: string;
  logo?: string | null;
};

export function OrganizationAvatar({
  organization,
  className,
}: {
  organization: OrganizationAvatarOrganization;
  className?: string;
}) {
  const { id, name, logo } = organization;

  if (!logo || isOrganizationColor(logo)) {
    const color = isOrganizationColor(logo) ? logo : getOrganizationColor(id);
    const isHex = color.startsWith("#");

    return (
      <div
        aria-hidden="true"
        className={cn("shrink-0 rounded-full", !isHex && color, className)}
        style={isHex ? { backgroundColor: color } : undefined}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <Image
        alt={name}
        src={logo}
        fill
        sizes="96px"
        unoptimized
        className="object-cover"
      />
    </div>
  );
}
