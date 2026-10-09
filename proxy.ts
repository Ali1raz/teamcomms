import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

const protectedRoutes = ["/organizations", "/accept-invite"];

async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for non-protected routes
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the full path WITH search params
    const fullPath = request.nextUrl.pathname + request.nextUrl.search;
    loginUrl.searchParams.set("from", fullPath);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

const aj = arcjet({
  key: env.ARCJET_KEY,
  rules: [
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      // Block all bots except the following
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        "CATEGORY:MONITOR",
        "CATEGORY:PREVIEW",
        "STRIPE_WEBHOOK",
        // See the full list at https://arcjet.com/bot-list
        "CATEGORY:MONITOR", // Uptime monitoring services
        "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
        "VERCEL_MONITOR_PREVIEW", // Vercel's bot for preview deployments
      ],
    }),
  ],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|/rpc).*)"],
};

// Pass any existing middleware with the optional existingMiddleware prop
export const proxy = createMiddleware(aj, async (request: NextRequest) => {
  return authMiddleware(request);
});
