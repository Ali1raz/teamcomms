import { InfiniteSlider } from "../motion-primitives/infinite-slider";
import {
  BetterAuth,
  ESLint,
  Git,
  GitHub,
  Neon,
  Nextjs,
  PostgreSQL,
  Prettier,
  Prisma,
  Shadcnui,
  TailwindCSS,
  Vercel,
} from "./tech";

const logos = [
  {
    label: "Next.js",
    icon: <Nextjs className="invert dark:invert-0" />,
  },
  {
    label: "Github",
    icon: <GitHub className="invert dark:invert-0" />,
  },
  {
    label: "BetterAuth",
    icon: <BetterAuth className="invert dark:invert-0" />,
  },
  {
    label: "ESLint",
    icon: <ESLint className="invert dark:invert-0" />,
  },
  {
    label: "Git",
    icon: <Git />,
  },
  {
    label: "Neon",
    icon: <Neon />,
  },
  {
    label: "PostgreSQL",
    icon: <PostgreSQL />,
  },
  {
    label: "Prettier",
    icon: <Prettier />,
  },
  {
    label: "Prisma",
    icon: <Prisma className="invert dark:invert-0 size-12 sm:size-16" />,
  },
  {
    label: "TailwindCSS",
    icon: <TailwindCSS />,
  },
  {
    label: "Vercel",
    icon: <Vercel className="invert dark:invert-0" />,
  },
  {
    label: "shadcn/ui",
    icon: <Shadcnui className="invert dark:invert-0" />,
  },
];
export function LogoCloud() {
  return (
    <div className="mask-[linear-gradient(to_right,transparent,black,transparent)] overflow-hidden py-4">
      <InfiniteSlider gap={42} reverse speed={80} speedOnHover={25}>
        {logos.map((logo) => (
          <div
            key={logo.label}
            className="flex sm:size-20 size-14 items-center justify-center py-3"
          >
            {logo.icon}
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}
