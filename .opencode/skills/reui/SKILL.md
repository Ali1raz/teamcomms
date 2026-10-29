---
name: reui
description: "ReUI design and component rules for React apps on shadcn/ui and Tailwind. Use for any UI work in a project with @reui in components.json or a components/reui folder, and in any shadcn project that asks for data grids, kanban boards, dashboards or full pages: building or restyling pages, forms and tables; colors, theme tokens and dark mode; spacing, typography and layout; animation and hover motion; installing ReUI components, examples, Pro blocks or Motion Icons. Works with the ReUI MCP."
allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)
metadata:
  user-invocable: "false"
---

> **ReUI skill version `68f0e6fa91`.** If the ReUI MCP's `get_agent_skill` reports a newer `version`, re-run the ReUI installer in the mode it was installed with to update this skill: `get_agent_skill` -> `install.recommended` from the project root, with `REUI_GLOBAL=1` before `node` when this file is `~/.claude/skills/reui/SKILL.md` or `~/.agents/skills/reui/SKILL.md` (a global install). Cloud/tools-only agents have no local file and always read the latest - they can ignore this.

# ReUI

ReUI is an existing design system on shadcn/ui. Keep its look. Generic frontend advice (vary fonts or themes, gradients, page-load or staggered reveals, "2-3 intentional motions", Framer Motion) does not apply here.
It ships free components, free `c-*` examples, Pro blocks and Ultimate Motion Icons through the shadcn CLI; the ReUI MCP finds them and serves their APIs.

## Order of authority

1. The installed style (`components.json` `style`, baked into `components/ui` and `components/reui`): it owns radius, height, padding, shadow and overlay motion.
2. The installed component's variants and props (`size`, `variant`, `spacing`).
3. These rules and the topic files.
4. Other design skills, then your taste: where they disagree with 1 to 3, ReUI wins. Never redefine `--ease-out` or any Tailwind built-in.

## Before you write UI code, write this plan in your reply

1. Surface: operational, marketing or flow.
2. Archetype: 1 from [compose.md](./rules/compose.md).
3. Container family: Frame-led, Card-led, or Cards for the KPIs and a Frame for the table.
4. Density: dense (`size="sm"` on controls that take it) or default.
5. Regions: top to bottom, each with the item that fills it.
6. States: empty, loading and error for each data region.
7. Motion: none, or the 1 entrance.

Then build exactly that plan; if you deviate, say where.

## The loop

1. **Find**: `compose_page` for a full page, else `search` with `type` and `component` hints.
2. **Install**: `npx shadcn@latest add @reui/<name> --yes`, with `<name>` exactly as a tool returned it (shadcn/ui parts install by bare name: `npx shadcn@latest add button --yes`).
3. **Read the API on your base**: `components.json` style `base-nova` is Base UI, `radix-nova` is Radix. Call `get_component([...componentsUsed])` once, then install 1 `get_examples` example and read its files.
4. **Adapt**: change data, copy and props; keep the structure and classes.
5. **Check**, after every UI edit, follow-ups included: `validate_usage` on any name you did not read, the self-checks C1 to C4 in [quality.md](./rules/quality.md), [anti-patterns.md](./rules/anti-patterns.md), `get_audit_checklist`, typecheck, lint. Hand back in the 5 lines quality.md gives.

Show every item's `previewUrl` whenever you list, recommend or install it.

## Rules that always apply

- **Owners**: tables `data-grid`, filtering `filters`, boards `kanban`, modals `Dialog` (destructive confirms `AlertDialog`), toasts `sonner`; never hand-roll.
- **Color**: semantic tokens for meaning; state colors through Badge or Alert variants (`@reui/badge` and `@reui/alert`, not shadcn's); raw palette only for categorical identity, always with its `dark:` pair.
- **Contrast**: never `text-success` or `text-warning` as body text in light mode, and never `text-<state>-foreground` on a solid `bg-<state>` fill.
- **Shape**: no `rounded-*` except `rounded-full`, and no `shadow-*`, `h-*` or `px-*` on Button, Input, SelectTrigger, Card or Frame; pick `size` and `variant`. A panel is a Card or Frame, never a div with `rounded-lg border`.
- **Spacing**: `gap-*` on the parent, not `space-y-*`; `gap-1` to `gap-2` in a row, `gap-3` to `gap-4` between groups, `gap-6` to `gap-8` between sections; title to description `gap-0.5`.
- **Type**: `text-sm` body, `text-xs` meta (controls keep their style's size), `font-medium` or `font-semibold`, headings `tracking-tight`, numbers `tabular-nums`; nothing below `text-xs` except illustrative mini-UI.
- **Motion**: installed components own their motion. Your own code uses `transition-colors` for hover and press, `duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]` to reveal, `duration-300` with the same curve at most (media hover zoom: 500), and `SPRING` (`{ type: "spring", visualDuration: 0.25, bounce: 0 }`) for drag and reorder. At most 1 entrance animation per view (a stagger counts as 1). Animate only `transform` and `opacity`, CSS before motion/react, never set state per frame; `<MotionConfig reducedMotion="user">` once at the root plus `motion-reduce:` on CSS, where reduced motion means a calm fade, not nothing.
- **Surfaces**: prefer 1 container family per screen. With a KPI row and a table, use FramePanels for both, or Cards for the KPIs and a Frame for the table; never a Card inside a Frame or a Frame inside a Card. Icons come from 1 library, the `iconLibrary` in `components.json` (on Ultimate, 1 Motion Icon on the primary action is the exception).
- **States**: each data region has empty (1 action), loading (a `Skeleton` in the real layout) and error (Retry) states; light and dark work.
- **Never invent**: never write a prop, variant or `@reui/` name you did not read in an `api`, an installed file or a tool result.

## Topics

Always read `compose` before building a screen, and `quality` plus `anti-patterns` at the Check step. Besides those, read only the topic files the task touches, at most 4 (for example `color`, `motion`, `layout` and `components`).

Installed skill: open the file. MCP only: call `get_agent_skill` with the topic, or fetch `https://mcp.reui.io/skill/reui/<file>`.

| Topic           | File                                               | Read when                                     |
| --------------- | -------------------------------------------------- | --------------------------------------------- |
| `compose`       | [rules/compose.md](./rules/compose.md)             | before building any screen or section         |
| `workflow`      | [rules/workflow.md](./rules/workflow.md)           | `compose_page`, search hints, installing      |
| `adapting`      | [rules/adapting.md](./rules/adapting.md)           | changing an installed block or example        |
| `components`    | [rules/components.md](./rules/components.md)       | `data-grid`, `filters`, `kanban` and the rest |
| `color`         | [rules/color.md](./rules/color.md)                 | any color, status, chart or dark mode choice  |
| `theming`       | [rules/theming.md](./rules/theming.md)             | the styles, radius, density and sizes         |
| `motion`        | [rules/motion.md](./rules/motion.md)               | any transition, animation or motion/react     |
| `layout`        | [rules/layout.md](./rules/layout.md)               | house defaults, hierarchy, surfaces, states   |
| `icons`         | [rules/icons.md](./rules/icons.md)                 | icon imports, Motion Icons                    |
| `quality`       | [rules/quality.md](./rules/quality.md)             | the done gate: self-checks, a11y, hand-back   |
| `anti-patterns` | [rules/anti-patterns.md](./rules/anti-patterns.md) | the Check step: drift pairs, stale habits     |
| `registry`      | [rules/registry.md](./rules/registry.md)           | free vs Pro vs Ultimate, base vs radix        |
| `cli`           | [rules/cli.md](./rules/cli.md)                     | `components.json`, license key, install flags |
| `tools`         | [tools.md](./tools.md)                             | MCP result shapes, errors, quota, commands    |

## Plans

Free covers components, `c-*` examples, this skill and the MCP (a ReUI account and a daily allowance). Pro adds blocks. Ultimate adds Motion Icons. A plan miss is a normal answer with `locked: true`; keep building with what the plan covers.
