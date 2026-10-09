"use client";

import {
  Apple,
  Calendar,
  Clock,
  Globe,
  LogOut,
  MapPin,
  Monitor,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Android,
  Chrome,
  Edge,
  Firefox,
  Windows,
} from "@/components/general/tech";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { errorMessage } from "@/lib/error-message";
import { tryCatch } from "@/lib/try-catch";
import type { ApiResponseType } from "@/lib/types";
import { cn, formatLocalDateTime } from "@/lib/utils";
import type { UserGetAllSessions } from "../data/user-get-all-sessions";

export function UserSessionsCard({
  sessions,
  currentToken,
}: {
  sessions: UserGetAllSessions[];
  currentToken: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isAllPending, startAllTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function revokeSessionByToken(token: string): Promise<ApiResponseType> {
    try {
      await authClient.revokeSession({ token });
      return { status: "success", message: "Successfully revoked session." };
    } catch (e) {
      return {
        status: "error",
        message: errorMessage(e, "Something went wrong."),
      };
    }
  }

  async function revokeOtherSessions(): Promise<ApiResponseType> {
    try {
      await authClient.revokeOtherSessions();
      setOpen(false);
      return {
        status: "success",
        message: "Successfully revoked all other sessions.",
      };
    } catch (e) {
      return {
        status: "error",
        message: errorMessage(e, "Something went wrong."),
      };
    }
  }

  function handleRevokeSession(sessionToken: string) {
    startTransition(async () => {
      const { data: res, error } = await tryCatch(
        revokeSessionByToken(sessionToken)
      );
      if (error) {
        toast.error("Something went wrong.");
        return;
      }
      if (res.status === "success") {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  }

  function handleRevokeOtherSessions() {
    startAllTransition(async () => {
      const { data: res, error } = await tryCatch(revokeOtherSessions());
      if (error) {
        toast.error("Something went wrong.");
        return;
      }
      if (res.status === "success") {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.message);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">Active Sessions</h2>
        <p className=" text-muted-foreground">
          Manage where you&apos;re logged in. Revoke access from devices you
          don&apos;t recognize.
        </p>
      </div>

      {/* Session list */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const isCurrent = currentToken === session.token;
          const { browserIcon, browserName, osIcon, osName } = getDeviceInfo(
            session.userAgent ?? null
          );

          return (
            <Card
              key={session.id}
              className={cn(
                "transition-all duration-200",
                isCurrent
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "hover:border-muted-foreground/20"
              )}
            >
              <CardHeader>
                <CardAction>
                  <Button
                    disabled={isPending}
                    onClick={() => handleRevokeSession(session.token)}
                    variant={"outline"}
                    className={cn(
                      "shrink-0 gap-1.5",
                      !isCurrent &&
                        "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    )}
                  >
                    <LogOut className="size-3.5" />
                    {isCurrent ? "Sign out" : "Revoke"}
                  </Button>
                </CardAction>
                <CardTitle>
                  <div className="sm:text-2xl text-xl flex items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="size-4">{browserIcon}</span>
                      <span>{browserName}</span>
                    </div>
                    <span>on</span>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="size-4 shrink-0">{osIcon}</span>
                      <span>{osName}</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  {/* Meta info */}
                  <div className="flex flex-col gap-x-4 gap-y-1 overflow-hidden text-ellipsis">
                    {session.ipAddress && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="size-4" />
                        <code className="font-mono">{session.ipAddress}</code>
                      </span>
                    )}
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="size-4" />
                      Active {formatLocalDateTime(session.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="size-4" />
                      Expires {formatLocalDateTime(session.expiresAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Danger zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <ShieldAlert className="size-6 text-destructive" />
            <CardTitle className="text-2xl text-destructive">
              Danger Zone
            </CardTitle>
          </div>
          <CardDescription>
            Signing out of all other devices will immediately invalidate their
            sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <Dialog defaultOpen={open} onOpenChange={(o) => !o}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isAllPending}
                className="gap-2"
              >
                <LogOut className="size-4" />
                Sign out from all other devices
              </Button>
            </DialogTrigger>
            <DialogContent>
              <div className="flex flex-col items-center text-center gap-2 ">
                <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <ShieldAlert className="size-6 text-destructive" />
                </div>
                <DialogTitle>Sign out all other devices?</DialogTitle>
                <DialogDescription>
                  This will immediately revoke access from every device except
                  your current one. They&apos;ll need to sign in again.
                </DialogDescription>
              </div>
              <DialogFooter className="">
                <DialogClose asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleRevokeOtherSessions}
                  disabled={isAllPending}
                  size="sm"
                  className="flex-1"
                >
                  {isAllPending ? "Signing out…" : "Sign out all"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Device Detection ──────────────────────────────────────────────────────────

type DeviceInfo = {
  browserName: string;
  browserIcon: React.ReactNode;
  osName: string;
  osIcon: React.ReactNode;
  deviceIcon: React.ReactNode;
};

function getDeviceInfo(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {
      browserName: "Unknown Browser",
      browserIcon: <Globe className="size-4" />,
      osName: "Unknown OS",
      osIcon: <Monitor className="size-4" />,
      deviceIcon: <Monitor className="size-5" />,
    };
  }

  const ua = userAgent.toLowerCase();

  // Browser detection
  const browserName = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome/")
      ? "Chrome"
      : ua.includes("firefox/")
        ? "Firefox"
        : ua.includes("safari/")
          ? "Safari"
          : "Browser";

  const browserIcon =
    browserName === "Edge" ? (
      <Edge className="size-4" />
    ) : browserName === "Chrome" ? (
      <Chrome className="size-4" />
    ) : browserName === "Firefox" ? (
      // Use Flame as stand-in if <Firefox /> isn't in companies
      <Firefox className="size-4" />
    ) : (
      <Globe className="size-4" />
    );

  // OS detection
  const isMobile =
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipad") ||
    ua.includes("ios");

  const osName = ua.includes("windows")
    ? "Windows"
    : ua.includes("mac os") || ua.includes("macintosh")
      ? "macOS"
      : ua.includes("android")
        ? "Android"
        : ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")
          ? "iOS"
          : ua.includes("linux")
            ? "Linux"
            : "Unknown OS";

  const osIcon =
    osName === "Windows" ? (
      <Windows className="size-4" />
    ) : osName === "macOS" || osName === "iOS" ? (
      <Apple className="size-4" />
    ) : osName === "Android" ? (
      <Android className="size-4" />
    ) : (
      <Monitor className="size-4" />
    );

  const deviceIcon = isMobile ? (
    <Smartphone className="size-5" />
  ) : (
    <Monitor className="size-5" />
  );

  return { browserName, browserIcon, osName, osIcon, deviceIcon };
}
