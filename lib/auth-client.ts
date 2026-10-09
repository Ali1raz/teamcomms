import {
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    lastLoginMethodClient({
      cookieName: "teamcomms.last_used_login_method", // match the server-side plugin's cookie name
    }),
    organizationClient({
      ac,
      roles,
      teams: {
        enabled: true,
      },
    }),
  ],
});
