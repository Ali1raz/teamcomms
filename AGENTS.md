<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

### Contributor Workflow

**After pulling changes:**

```bash
pnpm graph:update    # Incremental update (fast, no LLM cost)
```

**Before starting work on a feature:**

```bash
pnpm graph:query "How does X work?"   # Orient yourself first
```

**Key principles:**

1. Never commit `graphify-out/` - it's in `.gitignore`
2. Run `graph:update` after `git pull` - keeps graph fresh
3. Query before grep - `graph:query` returns scoped subgraph, not 200 files
4. `graph:build` = deep mode - use when adding new patterns/libraries

<!-- BEGIN:reui-agent-rules -->

## ReUI design rules (every UI edit, follow-ups included)

This project uses an existing design system: ReUI on shadcn/ui. Keep its look. Generic frontend advice (vary fonts or themes, gradients, page-load or staggered reveals, "2-3 intentional motions", Framer Motion) does not apply here, and other design skills lose where they disagree.

1. Use installed components first (`components/ui`, `components/reui`): tables `data-grid`, filtering `filters`, boards `kanban`, modals `Dialog` or `AlertDialog`, toasts `sonner`. Never set height, radius, padding, shadow or motion on them; use `size`, `variant`, `spacing`.
2. Color: semantic tokens. State: `<Badge variant="success-light">` from `@/components/reui/badge` at default size, or Alert variants. Raw palette only for categorical identity, with its `dark:` pair.
3. Spacing: `gap-*` on the parent: `gap-1` to `gap-2` in a row, `gap-3` to `gap-4` between groups, `gap-6` to `gap-8` between sections. Type: `text-sm` body, `text-xs` meta, nothing smaller; never resize FrameTitle or CardTitle.
4. Motion: installed parts already animate; never retime them. Yours: hover `transition-colors`; reveal `duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]`; transform and opacity only; never `transition-all`, bounce, or a stagger on table rows or lists of 20+; at most 1 entrance per view; `MotionConfig reducedMotion="user"` plus `motion-reduce:`.
5. Every data region: empty state with an action, `Skeleton` loading, inline error with Retry.
6. Before UI code, write the plan from `.agents/skills/reui/SKILL.md` in your reply. Before you finish, run its self-check on the files you changed and fix every hit (2 rounds at most). Full rules: `.agents/skills/reui/SKILL.md`. If that folder is missing, call the `reui` MCP tool `get_agent_skill`.

Managed by the ReUI installer. Edits between the markers are replaced on the next run.

<!-- END:reui-agent-rules -->

Project uses feature based routing for example:

```
organization/[id]/invitations // for invitations of specific organization
organization/[id]/teams // for teams of specific organization
organization/[id]/teams/[id]/members // for members of specific team
```

Always create constants for features in respective routes for example:

```
app/(organization)/organizations/[organizationId]/invitations/search-params.ts // for search params of invitations
```

Always create app level constants in lib/app/constants.ts
Before adding any enum, union type, or constant set:

1. Search the codebase (and shared/generated types, DB schema, API types) for an existing one that covers the values.
2. If one exists, import and use it.
3. If it almost fits, extend the existing one in place. Don't create a parallel copy.
4. Only create a new enum if nothing exists, and say so in your summary.
5. Don't extract functions that are only used inside one file, use inline instead.

### Bad

```ts
// Duplicates an existing enum under a new name
type OrderState = 'pending' | 'paid' | 'shipped'

if (order.status === 'paid') { ... } // magic string
```

### Good

```ts
import { OrderStatus } from '@/types/order' // wherever it already exists in codebase

if (order.status === OrderStatus.Paid) { ... }
```

dont run pnpm build or type check until mentioned,

- If the request is ambiguous, ask one clear question instead of guessing.
- Derive types from a single source (zod schema, parser, DB/API types). Never hand-write a duplicate.
- One source of truth for each constant, default, and param key.
- No `console.log` left in committed code.
- No placeholder code, mock data, or `TODO` stubs presented as finished work.

## Comments & naming

- Comment the "why", never the "what".
- Names must say what a thing is. No `data`, `temp`, `handleStuff`, `utils2`.
- Match the naming and file conventions already in the repo.

dont summarize changes until mentioned explicitly

```ts
// ❌ Bad: silences the error instead of fixing it
const user = data as any;
// ✅ Good: validated at the boundary, type derived from schema
const user = userSchema.parse(data);
```
