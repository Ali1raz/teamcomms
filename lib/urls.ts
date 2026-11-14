import { ORGANIZATIONS_PATH } from "@/lib/app/constants";

export function buildOrganizationsRedirect(
  organizationId: string,
  next: string
): string {
  return `${ORGANIZATIONS_PATH}?organizationId=${encodeURIComponent(
    organizationId
  )}&next=${encodeURIComponent(next)}`;
}

export function normalize(urlOrPath: string) {
  if (urlOrPath.length > 1 && urlOrPath.endsWith("/"))
    return urlOrPath.slice(0, -1);
  return urlOrPath;
}

/**
 * @returns if `href` is matching the given pathname
 */
export function isActive(
  href: string,
  pathname: string,
  nested = false
): boolean {
  href = normalize(href);
  pathname = normalize(pathname);

  return href === pathname || (nested && pathname.startsWith(`${href}/`));
}
