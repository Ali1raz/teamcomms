"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import ErrorComponent from "@/app/error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConfetti } from "@/hooks/use-confetti";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { formatLocalDateTime } from "@/lib/utils";
import Logo from "@/public/team-comms.png";

export default function AcceptInvitePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery(
    orpc.invitation.get.queryOptions({ input: { invitationId: id } })
  );
  const router = useRouter();
  const { triggerConfetti } = useConfetti();
  const [isPending, startTransition] = useTransition();
  const [isRejecting, startRejectTransition] = useTransition();
  const queryClient = useQueryClient();

  const inv = data?.invitation;

  function accept() {
    startTransition(async () => {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId: id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      triggerConfetti();
      queryClient.invalidateQueries({
        queryKey: orpc.organization.invitations.list.queryKey({
          input: { organizationId: data.invitation.organizationId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.organization.members.list.queryKey(),
      });
      toast.success(
        "Invitation accepted, you are now a member in the organization!"
      );
      router.push(`/organizations/${data.invitation.organizationId}`);
    });
  }

  function reject() {
    startRejectTransition(async () => {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId: id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Invitation rejected successfully!");
      router.push("/");
    });
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-muted/30 w-full">
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin size-8" />
        </div>
      </div>
    );

  if (error) return <ErrorComponent error={error} />;

  if (!inv) return notFound();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-6 md:p-10">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Image
            src={Logo}
            alt="TeamComms Logo"
            width={40}
            height={40}
            className="object-cover"
          />
          <p className="text-primary">TeamComms</p>
        </Link>
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl font-bold">
              You&apos;re invited!
            </CardTitle>
            <CardDescription className="max-w-md mx-auto">
              <p>
                <span className="text-primary font-medium">
                  {inv.inviterEmail}
                </span>{" "}
                has invited you to join{" "}
                <span className="font-medium text-primary underline underline-offset-4">
                  {inv.organizationName}
                </span>{" "}
                in TeamComms.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Organization</span>
                <span className="font-medium">{inv.organizationName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your email</span>
                <span className="font-medium">{inv.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge
                  variant={
                    inv.role === "owner"
                      ? "default"
                      : inv.role === "admin"
                        ? "outline"
                        : "ghost"
                  }
                >
                  {inv.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium">
                  {formatLocalDateTime(inv.expiresAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between w-full">
              <Button onClick={accept} disabled={isPending || isRejecting}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Accepting...
                  </>
                ) : (
                  "Accept"
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={reject}
                disabled={isRejecting || isPending}
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
