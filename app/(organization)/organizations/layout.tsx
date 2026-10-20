import type { Metadata } from "next";
import { SITE } from "@/lib/app/site";

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE.name}`,
    default: SITE.name,
  },
};

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main>{children}</main>;
}
