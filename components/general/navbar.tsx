"use client";

import { LogOut, Menu, X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSignOut } from "@/hooks/use-signout";
import { authClient } from "@/lib/auth-client";
import Logo from "@/public/team-comms.png";
import { Skeleton } from "../ui/skeleton";
import { ThemeToggle } from "./theme-toggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;

    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }

    if (latest > previous && latest > 150) {
      setIsHidden(true);
      setIsOpen(false);
    } else {
      setIsHidden(false);
    }
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const { data, isPending } = authClient.useSession();
  const handleSignOut = useSignOut();

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 mx-auto w-full max-w-6xl max-md:my-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isHidden ? 0 : 1,
        y: isHidden ? -20 : 0,
      }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        className="relative mx-auto max-w-7xl"
        animate={{
          scale: isScrolled ? 0.98 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={`flex flex-row items-center justify-between gap-4 rounded-full p-4 transition-colors duration-300 ${
            isScrolled ? "bg-background/80" : "bg-background"
          }`}
          animate={{
            backdropFilter: "blur(12px)",
            boxShadow: isScrolled
              ? "0 4px 20px -5px rgba(0, 0, 0, 0.1)"
              : "0 0 0 0 rgba(0, 0, 0, 0)",
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-row items-center gap-2 font-bold text-lg">
            <Image src={Logo} alt="Logo" width={40} height={40} /> TeamComms
          </div>

          <section className="hidden flex-row items-center gap-2 lg:flex">
            {isPending ? (
              <Skeleton className="w-20 h-10 bg-muted rounded-sm" />
            ) : (
              <div className="flex flex-row gap-2">
                {data?.session ? (
                  <>
                    <Link href="/organizations" className={buttonVariants()}>
                      Dasboard
                    </Link>
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut /> Logout
                    </Button>
                  </>
                ) : (
                  <Link
                    className={buttonVariants({ variant: "default" })}
                    href="/login"
                  >
                    Log In
                  </Link>
                )}
              </div>
            )}
            <ThemeToggle />
          </section>

          <section className="flex flex-row items-center gap-2 lg:hidden">
            {/* <Button className="rounded" size="default">
              Book a call
            </Button> */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded"
              onClick={() => setIsOpen(!isOpen)}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </section>
        </motion.div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden lg:hidden"
            >
              <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background/95 p-4 backdrop-blur-xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                >
                  {isPending ? (
                    <Skeleton className="w-full h-10 bg-muted rounded-sm" />
                  ) : data?.session ? (
                    <Link
                      href={"/organizations"}
                      className="flex flex-row items-center justify-between rounded px-4 py-3 font-medium transition-colors hover:bg-muted"
                    >
                      Dasboard
                    </Link>
                  ) : (
                    <Link
                      className="flex flex-row items-center justify-between rounded px-4 py-3 font-medium transition-colors hover:bg-muted"
                      href="/login"
                    >
                      Log In
                    </Link>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                  className="my-2 border-t border-border"
                />

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.25 }}
                  className="flex flex-row items-center justify-between gap-2"
                >
                  {data?.session ? (
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut /> Logout
                    </Button>
                  ) : (
                    <Link
                      className={buttonVariants({ variant: "default" })}
                      href="/login"
                    >
                      Log In
                    </Link>
                  )}
                  <ThemeToggle />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default Navbar;
