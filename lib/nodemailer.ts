import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.NODEMAILER_USER,
    pass: env.NODEMAILER_APP_PASSWORD,
  },
});
