import type { ArcjetNextRequest } from "@arcjet/next";
import arcjet, { detectBot, shield, slidingWindow } from "@/lib/arcjet";
import type { User } from "@/lib/auth";
import { formatLocalDateTime } from "@/lib/utils";
import { base } from "./bast";

const aiAj = () =>
  arcjet
    .withRule(
      shield({
        mode: "LIVE",
      })
    )
    .withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: 2,
      })
    )
    .withRule(
      detectBot({
        mode: "LIVE",
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
      })
    );
export const aiMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest;
    user: User;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const dec = await aiAj().protect(context.request, {
      userId: context.user.id,
    });

    if (dec.isDenied()) {
      if (dec.reason.isRateLimit()) {
        throw errors.RATE_LIMITED({
          message: `You are making too many requests. Please try again later after: ${formatLocalDateTime(dec.reason.resetTime as Date)}.`,
        });
      }

      if (dec.reason.isBot()) {
        throw errors.FORBIDDEN({
          message: "Bot detected. Request blocked!",
        });
      }

      if (dec.reason.isShield()) {
        throw errors.FORBIDDEN({
          message: "Request blocked by security policy (WAF)!",
        });
      }

      if (dec.reason.isSensitiveInfo()) {
        throw errors.FORBIDDEN({
          message:
            "Sensitive information detected. Please remove PII (e.g. credit card numbers, phone numbers) and try again!",
        });
      }

      throw errors.FORBIDDEN({
        message: "Request blocked!",
      });
    }

    return next();
  });
