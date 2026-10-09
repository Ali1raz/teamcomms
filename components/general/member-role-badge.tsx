import type { MembershipRole } from "@/generated/prisma/enums";
import { Badge } from "../ui/badge";

export function MemberRoleBadge({ role }: { role: MembershipRole }) {
  return (
    <Badge
      variant={
        role === "owner"
          ? "destructive"
          : role === "admin"
            ? "default"
            : "secondary"
      }
    >
      {role}
    </Badge>
  );
}
