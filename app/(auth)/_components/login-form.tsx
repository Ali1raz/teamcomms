"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { GitHub, Google } from "@/components/general/tech";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isGithubPending, startGithubTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("from") ?? "/";
  const lastMethod = authClient.getLastUsedLoginMethod();

  function loginWithGitHub() {
    startGithubTransition(async () => {
      await authClient.signIn.social({
        provider: "github",
        // Send the user back to the page they originally tried to access.
        callbackURL: callbackUrl,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Please wait, You will be redirected shortly...");
          },
          onError: ({ error }) => {
            toast.error(`Login failed`, { description: error.message });
            return;
          },
        },
      });
    });
  }
  function loginWithGoogle() {
    startGoogleTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        // Send the user back to the page they originally tried to access.
        callbackURL: callbackUrl,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Please wait, You will be redirected shortly...");
          },
          onError: ({ error }) => {
            toast.error(`Login failed`, { description: error.message });
            return;
          },
        },
      });
    });
  }

  return (
    <Card className={cn("flex flex-col gap-6 sm:gap-8", className)} {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Login with your account to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Button
            variant="outline"
            className="w-full"
            onClick={loginWithGitHub}
            disabled={isGithubPending || isGooglePending}
          >
            {isGithubPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <GitHub className="size-4 mr-2 invert dark:invert-0" />
            )}
            Login with Github
          </Button>
          {lastMethod === "github" && <LastUsedBadge />}
        </div>
        <div className="relative">
          <Button
            variant="outline"
            className="w-full"
            onClick={loginWithGoogle}
            disabled={isGooglePending || isGithubPending}
          >
            {isGooglePending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Google className="size-4 mr-2" />
            )}
            Login with Google
          </Button>
          {lastMethod === "google" && <LastUsedBadge />}
        </div>
      </CardContent>
    </Card>
  );
}

function LastUsedBadge() {
  return (
    <Badge
      variant="outline"
      className="outline-primary outline-1 absolute right-0 -top-2"
    >
      Last used
    </Badge>
  );
}
