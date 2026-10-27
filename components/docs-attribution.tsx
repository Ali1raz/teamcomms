import { gitConfig } from "@/lib/shared";

export function DocsAttribution() {
  return (
    <p className="text-muted-foreground text-sm">
      Built by{" "}
      <a
        className="underline decoration-dotted underline-offset-4"
        href={`https://github.com/${gitConfig.user}`}
        rel="noreferrer"
        target="_blank"
      >
        {gitConfig.user}
      </a>
      . Source on{" "}
      <a
        className="underline decoration-dotted underline-offset-4"
        href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
        rel="noreferrer"
        target="_blank"
      >
        GitHub
      </a>
      .
    </p>
  );
}
