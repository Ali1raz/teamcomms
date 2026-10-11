"use client";

import { FolderCode, Home } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/general/empty-state";
import { buttonVariants } from "@/components/ui/button";

type ErrorType = Error;

export default function GlobalError({ error }: { error: ErrorType }) {
  return (
    <EmptyState
      icon={FolderCode}
      title="Something went wrong"
      description={
        <>
          An unexpected error has occurred. Please try again later.
          <p className="text-destructive/80 text-sm">{error.message}</p>
        </>
      }
      titleClassName="mt-8 text-4xl"
      descriptionClassName="text-lg text-pretty"
      action={
        <Link className={buttonVariants({ variant: "outline" })} href="/">
          <Home />
          Go home
        </Link>
      }
    />
  );
}
