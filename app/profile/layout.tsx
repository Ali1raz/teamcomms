import type { Metadata } from "next";
import { SITE } from "@/lib/app/site";
import { OrganizationHeader } from "../(organization)/organizations/_components/header";

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE.name}`,
    default: SITE.name,
  },
};

export default function ProfileLayout(props: LayoutProps<"/profile">) {
  const { children } = props;
  return (
    <main className="w-full">
      <OrganizationHeader />
      <div className="max-w-6xl mx-auto">{children}</div>
    </main>
  );
}
