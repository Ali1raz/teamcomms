"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Logo from "@/public/team-comms.png";

const Footer = () => {
  return (
    <motion.div
      className="flex flex-col gap-8 items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Image src={Logo} alt="Logo" width={50} height={50} />

      <p className="text-muted-foreground">
        &copy; {new Date().getFullYear()} TeamComms. All rights reserved.
      </p>
    </motion.div>
  );
};

export default Footer;
