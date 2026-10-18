import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { getSessionCookie } from "better-auth/cookies";
import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { docsContentRoute, docsRoute } from "@/lib/shared";

const protectedRoutes = ["/organizations", "/accept-invite"];

const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`
);
const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`
);

// Rewrite documentation requests to their Markdown representation either when
// the `.md` suffix is used or when the client prefers Markdown via `Accept`.
function markdownRewrite(request: NextRequest) {
  const suffix = rewriteSuffix(request.nextUrl.pathname);
  if (suffix) {
    return NextResponse.rewrite(new URL(suffix, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const result = rewriteDocs(request.nextUrl.pathname);
    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl));
    }
  }

  return undefined;
}

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
  return markdownRewrite(request) ?? authMiddleware(request);
});
