import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/general/empty-state";

export default function Loading() {
  return (
    <EmptyState
      icon={Loader2}
      mediaClassName="size-12"
      iconClassName="size-8 animate-spin"
      title="Please wait"
      description="Please wait while we load the team."
      titleClassName="mt-4 text-4xl sm:mt-4"
      descriptionClassName="max-w-xs text-pretty"
    />
  );
}
