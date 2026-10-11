import { FolderCode, Home } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/general/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={FolderCode}
      title="Not Found"
      description="The page you are looking for does not exist."
      titleClassName="mt-8 text-4xl sm:mt-8"
      descriptionClassName="max-w-xs text-pretty"
      action={
        <Link className={buttonVariants({ variant: "outline" })} href="/">
          <Home />
          Go home
        </Link>
      }
    />
  );
}
