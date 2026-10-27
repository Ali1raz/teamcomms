# TeamComms

> An open-source, AI-powered real-time team messaging platform.

## Features

- **Organizations (Orgs)** — Create organization.
- **Teams** — Organize conversations into topic-based teams within each organization.
- **Threaded Messages** — Reply to any message in a thread to keep conversations focused
- **Image Uploads** — Share images directly in teams via UploadThing
- **AI Message Rewrite** — Let AI rewrite your message: adjust tone, fix grammar, or improve clarity
- **AI Thread Summarization** — Summarize long threads to catch up instantly without reading every reply
- **Email + OAuth Auth** — Sign in with GitHub
- **Email Verification** — Nodemailer-powered email verification flow
- **Rate Limiting** — Arcjet-powered rate limiting and bot protection on all API routes
- **Dark / Light Mode** — Full theme support via next-themes

## Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| Framework     | Next.js 16 (App Router)            |
| Language      | TypeScript                         |
| Database      | PostgreSQL + Prisma ORM            |
| Auth          | better-auth (organizations plugin) |
| API           | oRPC + TanStack Query              |
| AI            | Vercel AI SDK + OpenRouter         |
| Rich Text     | Tiptap editor                      |
| File Uploads  | UploadThing                        |
| Rate Limiting | Arcjet                             |
| UI            | shadcn/ui + Tailwind CSS v4        |
| Animations    | Motion                             |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/Ali1raz/team-comms.git
cd team-comms
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/team-comms?schema=public"

# Auth
BETTER_AUTH_SECRET=your_secret_here
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Email (Nodemailer)
NODEMAILER_USER=your_email@gmail.com
NODEMAILER_APP_PASSWORD=your_app_password

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Security
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=development

# File Uploads
UPLOADTHING_TOKEN=your_uploadthing_token
UPLOADTHING_SECRET_KEY=your_uploadthing_secret_key

# AI (via OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 4. Set up the database

```bash
pnpm db:migrate
```

### 5. Run the development server

```bash
pnpm dev
```

login to wrangler cli to your cloudflare account:

```bash
pnpm dlx wrangler login
```

generate wrangler types:

```bash
pnpm wrangler:types
```

run wrangler to serve the worker locally (because local dev server has to run in parallel):

```bash
pnpm wrangler:dev
```

Open [http://localhost:3000](http://localhost:3000) for the app.
Open [http://localhost:8787](http://localhost:8787) for wrangler dev server

## Database Scripts

| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `pnpm db:migrate`  | Run Prisma migrations                 |
| `pnpm db:push`     | Push schema changes without migration |
| `pnpm db:generate` | Regenerate Prisma client              |
| `pnpm db:sync`     | Push + generate in one step           |
| `pnpm db:studio`   | Open Prisma Studio                    |
| `pnpm db:seed`     | Seed the database                     |

## Project Structure

```
├── app/                  # Next.js App Router pages and API routes
├── components/           # React components (UI, chat, auth, etc.)
├── hooks/                # Custom React hooks
├── lib/                  # Core utilities (auth, db, orpc, ai, arcjet)
├── prisma/               # Prisma schema and migrations
└── public/               # Static assets
```

## AI Features

TeamComms integrates OpenAI-compatible models via OpenRouter and the Vercel AI SDK:

- **Message Rewrite** — Rewrite message → click AI rewrite → Each rewrite is a streaming API call.
- **Thread Summarization** — Click "Summarize thread" on any message thread → receive a streamed summary of the conversation.

You can configure which model is used by setting your `OPENROUTER_API_KEY` and choosing a model in `lib/ai.ts`.

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Open a Pull Request

## Knowledge Graph

This project uses [graphify](https://github.com/safishamsi/graphify) to maintain a queryable knowledge graph of the codebase.

```bash
# After pulling changes
pnpm graph:update

# Before starting work - orient yourself
pnpm graph:query "How does authentication work?"

# After significant changes
pnpm graph:update
# Or full rebuild with deep mode
pnpm graph:build
```

**Key commands:**

| Command                        | Description                            |
| ------------------------------ | -------------------------------------- |
| `pnpm graph:build`             | Full rebuild with deep mode            |
| `pnpm graph:update`            | Incremental update (fast, no API cost) |
| `pnpm graph:query "question"`  | Query the graph for focused context    |
| `pnpm graph:cluster`           | Re-cluster and regenerate report       |
| `pnpm graph:path "A" "B"`      | Shortest path between two nodes        |
| `pnpm graph:explain "concept"` | Plain-language explanation of a node   |

The graph outputs to `graphify-out/` (gitignored):

- `graph.html` — Interactive visualization
- `GRAPH_REPORT.md` — Audit report with god nodes, surprising connections, suggested questions
- `graph.json` — Raw graph data for programmatic access

**For AI agents:** Run `graphify query "<question>"` before reading files - it returns a scoped subgraph much smaller than grepping 200+ files.

## License

[MIT](./LICENSE)
