import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const requireSession = cache(async (currentPath?: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const loginUrl = `/login?from=${encodeURIComponent(currentPath || "/")}`;
    return redirect(loginUrl as Route);
  }

  return session;
});
