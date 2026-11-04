import { ShieldX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/general/empty-state";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <EmptyState
      icon={ShieldX}
      title="You are not authorized"
      description="You do not have permission to view this page."
      action={
        <Button asChild>
          <Link href="/organizations">Back to organizations</Link>
        </Button>
      }
    />
  );
}
