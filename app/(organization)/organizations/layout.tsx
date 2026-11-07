import type { Metadata } from "next";
import { SITE } from "@/lib/app/site";

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE.name}`,
    default: SITE.name,
  },
  // Authenticated app pages stay out of search results. The homepage lives
  // outside this segment and is intentionally indexable.
  robots: { index: false, follow: false },
};

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
