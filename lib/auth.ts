import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { lastLoginMethod, organization } from "better-auth/plugins";
import { SendEmail } from "@/app/action";
import { env } from "@/lib/env";
import { ac, roles } from "./permissions";
import { prisma } from "./prisma";
import { createSlug } from "./utils";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const firstMember = await prisma.member.findFirst({
            where: { userId: session.userId },
            orderBy: { createdAt: "asc" },
            select: { organizationId: true },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: firstMember?.organizationId ?? null,
            },
          };
        },
      },
    },
  },
  baseURL: {
    allowedHosts: [
      env.NEXT_PUBLIC_BETTER_AUTH_URL,
      "*.vercel.app", // All Vercel previews
      "localhost:*", // Local development all ports
    ],
    fallback: "http://localhost:3000",
    protocol: process.env.NODE_ENV === "development" ? "http" : "https",
  },

  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      prompt: "select_account",
    },
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    lastLoginMethod({
      cookieName: "teamcomms.last_used_login_method",
      maxAge: 60 * 60 * 24 * 30,
      storeInDatabase: false,
    }),
    organization({
      schema: {
        team: {
          additionalFields: {
            slug: {
              type: "string",
              required: true,
              input: true,
            },
          },
        },
      },
      teams: {
        enabled: true,
        allowRemovingAllTeams: true,
      },
      async sendInvitationEmail(data) {
        const {
          email,
          organization: { name },
          inviter: {
            user: { name: inviterName, email: inviterEmail },
          },
          role,
        } = data;
        const message = `You have been invited to join ${name} as a ${role} by ${inviterName} <${inviterEmail}>. click the link below to accept.`;

        await SendEmail({
          to: email,
          subject: `Invitation to join ${name}`,
          meta: {
            description: message,
            link: `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/accept-invite/${data.id}`,
          },
        });
      },
      organizationHooks: {
        beforeCreateTeam: async ({ team }) => {
          return {
            data: {
              ...team,
              slug: createSlug(team.name),
            },
          };
        },
        afterCreateTeam: async ({ team, user }) => {
          if (!team || !user) {
            console.log("[afterCreateTeam]: Team or user not found");
            return;
          }
          await prisma.teamMember.upsert({
            where: { teamId_userId: { teamId: team.id, userId: user.id } },
            update: {},
            create: { teamId: team.id, userId: user.id, createdAt: new Date() },
          });
        },
      },
      allowUserToCreateOrganization: true,
      ac,
      roles,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
export type FullOrg = typeof auth.$Infer.ActiveOrganization;
