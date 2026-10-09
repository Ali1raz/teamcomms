import { headers } from "next/headers";
import { auth, type FullOrg } from "@/lib/auth";
import { base } from "./bast";

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
  const org = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  return org;
};
