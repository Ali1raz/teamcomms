import type { ArcjetNextRequest } from "@arcjet/next";
import { os } from "@orpc/server";

export const base = os
  .$context<{ request: Request | ArcjetNextRequest }>()
  .errors({
    RATE_LIMITED: {
      message: "Too many requests. Please try again later.",
    },
    BAD_REQUEST: {
      message: "Bad request. Please check your input and try again.",
    },
    NOT_FOUND: {
      message: "The requested resource was not found.",
    },
    FORBIDDEN: {
      message: "You do not have permission to access this resource.",
    },
    UNAUTHORIZED: {
      message: "You need to be authenticated to access this resource.",
    },
    INTERNAL_SERVER_ERROR: {
      message: "An unexpected error occurred. Please try again later.",
    },
  });
