import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultRoles,
  defaultStatements,
} from "better-auth/plugins/organization/access";
import type { MembershipRole } from "@/generated/prisma/enums";

export const statement = {
  //   project: ["create", "share", "update", "delete"],
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  member: ac.newRole({
    // project: ["create"],
    ...defaultRoles.member.statements,
  }),
  admin: ac.newRole({
    // project: ["create", "update"],
    ...adminAc.statements,
  }),
  owner: ac.newRole({
    // project: ["create", "update", "delete"],
    ...defaultRoles.owner.statements,
  }),
} satisfies Record<MembershipRole, ReturnType<typeof ac.newRole>>;

export type Statements = typeof statement;

export type PermissionMap = {
  [K in keyof Statements]?: Statements[K][number][];
};
