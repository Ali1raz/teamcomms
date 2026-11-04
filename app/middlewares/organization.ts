import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { auth, type FullOrg } from "@/lib/auth";
import { base } from "./bast";

export const requireActiveOrganizationMiddleware = base
  .$context<{ organization: FullOrg }>()
  .middleware(async ({ context, next, errors }, organizationId: string) => {
    if (organizationId !== context.organization.id) {
      throw errors.ORGANIZATION_MISMATCH();
    }
    return next();
  });

export const requireOrganizationMiddleware = base
  .$context<{
    organization?: FullOrg;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const organization =
      context.organization ?? (await getCurrentOrganization());

    if (!organization) {
      throw errors.FORBIDDEN();
    }
    return next({
      context: { organization: organization },
    });
  });

const getCurrentOrganization = async () => {
  try {
    return await auth.api.getFullOrganization({
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) return null;
    throw error;
  }
};
