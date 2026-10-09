import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Logo from "@/public/team-comms.png";
import { LoginForm } from "../_components/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your TeamComms account",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
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
        <LoginForm />
      </div>
    </div>
  );
}
