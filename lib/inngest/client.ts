import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "teamcomms-app",
  isDev: process.env.NODE_ENV !== "production",
});
