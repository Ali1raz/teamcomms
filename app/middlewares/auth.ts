import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type User } from "@/lib/auth";
import { base } from "./bast";

type SessionOnly = typeof auth.$Infer.Session.session;

export const requireAuthMiddleware = base
  .$context<{
    user?: User;
    session?: SessionOnly;
  }>()
  .middleware(async ({ context, next }) => {
    const sessionData = context.user
      ? { user: context.user, session: context.session }
      : await getSession();

    if (!sessionData?.user) {
      return redirect("/login");
    }
    return next({
      context: {
        user: sessionData.user, // access context.user
        session: sessionData.session, // access context.session.activeTeamId etc
      },
    });
  });

const getSession = async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
};
