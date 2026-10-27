import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function userGetAllSessions() {
  const sessions = await auth.api.listSessions({
    headers: await headers(),
  });

  return sessions;
}

export type UserGetAllSessions = Awaited<
  ReturnType<typeof userGetAllSessions>
>[number];
