import { FolderCode, Home } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <Empty className="h-full bg-muted/40">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-muted rounded-full size-28">
          <FolderCode className="size-14" />
        </EmptyMedia>
        <EmptyTitle className="text-4xl mt-8">Not Found</EmptyTitle>
        <EmptyDescription className="max-w-xs text-pretty">
          The page you are looking for does not exist.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link className={buttonVariants({ variant: "outline" })} href="/">
          <Home />
          Go home
        </Link>
      </EmptyContent>
    </Empty>
  );
}
