import type { ArcjetNextRequest } from "@arcjet/next";
import arcjet, { detectBot, sensitiveInfo, slidingWindow } from "@/lib/arcjet";
import type { User } from "@/lib/auth";
import { formatLocalDateTime } from "@/lib/utils";
import { base } from "../bast";

const standardAj = () =>
  arcjet
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
        allow: [
          "CATEGORY:SEARCH_ENGINE",
          "CATEGORY:PREVIEW",
          "CATEGORY:MONITOR",
        ],
      })
    )
    .withRule(
      sensitiveInfo({
        mode: "LIVE",
        deny: ["CREDIT_CARD_NUMBER", "PHONE_NUMBER"],
      })
    );

export const heavyWritesecurityMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest;
    user: User;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const dec = await standardAj().protect(context.request, {
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
