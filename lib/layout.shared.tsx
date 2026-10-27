import type { BaseLayoutProps } from "@fumadocs/base-ui/layouts/shared";
import { appName, docsRoute, gitConfig } from "@/lib/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
      transparentMode: "top",
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        type: "menu",
        text: "Visit",
        items: [
          {
            text: "Docs",
            url: docsRoute,
          },
          {
            text: "App",
            url: gitConfig.appUrl,
            external: true,
          },
        ],
      },
    ],
  };
}
