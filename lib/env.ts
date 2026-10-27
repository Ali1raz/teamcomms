import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    NODEMAILER_USER: z.string().min(1),
    NODEMAILER_APP_PASSWORD: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    ARCJET_KEY: z.string().min(1),
    ARCJET_ENV: z
      .enum(["development", "production", "staging"])
      .default("development"),
    UPLOADTHING_TOKEN: z.string().min(1),
    UPLOADTHING_SECRET_KEY: z.string().min(1),
    OPENROUTER_API_KEY: z.string().min(1),
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  },
});
