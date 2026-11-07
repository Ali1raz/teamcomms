import arcjet, { createMiddleware, detectBot } from "@arcjet/next";
import { getSessionCookie } from "better-auth/cookies";
import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextProxy, type NextRequest, NextResponse } from "next/server";
import { CURRENT_PATH_HEADER } from "@/lib/app/constants";
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

function nextWithCurrentPath(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    CURRENT_PATH_HEADER,
    request.nextUrl.pathname + request.nextUrl.search
  );

  return NextResponse.next({ request: { headers: requestHeaders } });
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

  return nextWithCurrentPath(request);
}

// Bot categories allowed everywhere. AI crawlers are added separately for the
// homepage and docs so AI agents can read them without opening the rest of the
// app to AI scraping.
const defaultBotAllowList = [
  "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
  "CATEGORY:MONITOR", // Uptime monitoring services
  "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
  "STRIPE_WEBHOOK",
  "VERCEL_MONITOR_PREVIEW", // Vercel's bot for preview deployments
  // See the full list at https://arcjet.com/bot-list
] as const;

const aiBotAllowList = [...defaultBotAllowList, "CATEGORY:AI"] as const;

// A base client with no rules lets `withRule` clones share one decision cache.
const aj = arcjet({
  key: env.ARCJET_KEY,
  rules: [],
});

const defaultAj = aj.withRule(
  detectBot({
    mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
    allow: [...defaultBotAllowList],
  })
);

const aiAj = aj.withRule(
  detectBot({
    mode: "LIVE",
    allow: [...aiBotAllowList],
  })
);

// The homepage, crawl metadata, and docs pages (including the Markdown
// representations used by LLM clients) are open to AI crawlers.
const aiBotRoutes = [
  "/",
  "/robots.txt",
  "/sitemap.xml",
  docsRoute,
  docsContentRoute,
  "/llms.txt",
  "/llms-full.txt",
];

function isAiBotRoute(pathname: string) {
  return aiBotRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/inngest|/rpc).*)",
  ],
};

const existingMiddleware = async (request: NextRequest) => {
  return markdownRewrite(request) ?? authMiddleware(request);
};

// Pass any existing middleware with the optional existingMiddleware prop
const defaultProxy = createMiddleware(defaultAj, existingMiddleware);
const aiProxy = createMiddleware(aiAj, existingMiddleware);

export const proxy: NextProxy = (request, event) => {
  const middleware = isAiBotRoute(request.nextUrl.pathname)
    ? aiProxy
    : defaultProxy;

  return middleware(request, event);
};
