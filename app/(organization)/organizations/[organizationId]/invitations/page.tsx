import type { Metadata } from "next";
import { InvitationList } from "./_components/invitation-table";

export const metadata: Metadata = {
  title: "Invitations",
  description: "Manage invitations for this organization",
};

export default async function InvitationsPage(
  props: PageProps<"/organizations/[organizationId]/invitations">
) {
  const { params } = props;
  const { organizationId } = await params;

  return (
    <div className="p-4 sm:px-6 w-full max-w-6xl space-x-2">
      <InvitationList organizationId={organizationId} />
    </div>
  );
}
