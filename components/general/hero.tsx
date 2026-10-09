"use client";

import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "motion/react";
import DashboardImage from "@/public/image.png";
import DashboardImageLight from "@/public/image-light.png";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "../ui/skeleton";

const Hero = () => {
  const { data, isPending } = authClient.useSession();

  return (
    <motion.div
      className="flex flex-col gap-16 items-center justify-center py-2 lg:pt-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <section className="flex flex-col lg:flex-row items-center justify-between w-full max-xl:gap-6 max-w-7xl lg:max-w-6xl">
        <p className="max-md:font-medium text-3xl md:text-5xl lg:text-6xl xl:text-7xl lg:max-w-lg xl:max-w-2xl tracking-tighter text-center lg:text-left">
          The AI-ready platform for team communication
        </p>
        <section className="flex flex-col gap-8 items-center lg:items-start">
          <p className="text-md md:text-xl max-w-xl lg:max-w-md text-center lg:text-left">
            TeamComms organizes conversations into teams and threads and uses AI
            to keep teams in sync.
          </p>

          {isPending ? (
            <Skeleton className="w-24 h-10 bg-muted" />
          ) : data ? (
            <Link
              className={buttonVariants({
                className: "w-fit",
              })}
              href="/organizations"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              className={buttonVariants({
                className: "w-fit",
              })}
              href="/login"
            >
              Get Started
            </Link>
          )}
        </section>
      </section>
      <div className="relative my-18 pointer-events-none">
        <Image
          src={DashboardImage}
          alt="Hero"
          width={1200}
          height={800}
          className="h-75 w-full object-cover object-top-left md:h-auto md:max-w-7xl md:mx-auto rounded-x md:object-contain dark:flex hidden"
          priority
          // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
        />
        <Image
          src={DashboardImageLight}
          alt="Hero"
          width={1200}
          height={800}
          className="h-75 w-full object-cover object-top-left md:h-auto md:max-w-7xl md:mx-auto rounded-x md:object-contain flex dark:hidden"
          priority
          // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
        />
        <div className="max-md:hidden absolute bottom-0 left-0 h-12 lg:h-24 w-full bg-linear-to-b from-transparent to-background" />
      </div>
    </motion.div>
  );
};

export default Hero;
