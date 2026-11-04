import { ORGANIZATIONS_PATH } from "@/lib/app/constants";

export function buildOrganizationsRedirect(currentPath: string): string {
  return `${ORGANIZATIONS_PATH}?redirectTo=${encodeURIComponent(currentPath)}`;
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
