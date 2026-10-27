"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function useSignOut() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh();
          toast.success("Successfully signed out!");
        },
        onError: ({ error }) => {
          console.log("==>>>", error);
          toast.error("Failed to sign out");
        },
      },
    });
  };
  return handleSignOut;
}
