import { ShieldX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/general/empty-state";
import { Button } from "@/components/ui/button";

export default function OrganizationsUnauthorized() {
  return (
    <EmptyState
      icon={ShieldX}
      title="You are not authorized"
      description="You are not a member of this organization, or you do not have access to this page."
      action={
        <Button asChild>
          <Link href="/organizations">Back to organizations</Link>
        </Button>
      }
    />
  );
}
