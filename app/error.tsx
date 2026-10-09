"use client";

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

type ErrorType = Error;

export default function GlobalError({ error }: { error: ErrorType }) {
  return (
    <Empty className="h-full bg-muted/40">
      <EmptyHeader className="space-y-4">
        <EmptyMedia variant="icon" className="bg-muted rounded-full size-28">
          <FolderCode className="size-14" />
        </EmptyMedia>
        <EmptyTitle className="text-4xl mt-8">Something went wrong</EmptyTitle>
        <EmptyDescription className="text-lg text-pretty">
          An unexpected error has occurred. Please try again later.
          <p className="text-destructive/80 text-sm">{error.message}</p>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="mt-4">
        <Link className={buttonVariants({ variant: "outline" })} href="/">
          <Home />
          Go home
        </Link>
      </EmptyContent>
    </Empty>
  );
}
