"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/general/theme-toggle";
import UserAvatarDropdown from "@/components/general/user-avatar-dropdown";
import { authClient } from "@/lib/auth-client";
import Logo from "@/public/team-comms.png";

export function OrganizationHeader() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  return (
    <header className="w-full fixed top-0 left-0 px-4 py-4 bg-muted/50 backdrop-blur-sm border-b z-50">
      <div className="flex items-center max-w-6xl mx-auto justify-between">
        <Link href="/">
          <div className="flex items-center gap-2">
            <Image src={Logo} alt="Logo" width={40} height={40} /> TeamComms
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isPending ? (
            <div className="rounded-full w-16 h-8 bg-muted/90" />
          ) : (
            user && (
              <UserAvatarDropdown
                email={user.email}
                image={user.image}
                name={user.name}
              />
            )
          )}
        </div>
      </div>
    </header>
  );
}
