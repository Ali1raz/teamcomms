---
name: Inngest functions
description: Create, register, trigger, and invoke durable Inngest functions in this Next.js portal.
applyTo: "lib/inngest/**/*.ts,app/api/inngest/**/*.ts"
---

# Inngest function instructions

Use Inngest for background work, scheduled work, fan-out, retries, and workflows that
must survive a request ending or a server restart.

## Project integration

- Import the shared client from `@/lib/inngest/client`.
- Put function definitions in `lib/inngest/functions.ts` unless a feature has a
  strong reason for a separate file. New Inngest files and folders must use kebab-case.
- Register every function in `app/api/inngest/route.ts` in the `functions` array.
- Do not create another `Inngest` client.
- Use Prisma through `@/lib/prisma`; do not create a second Prisma client.
- Keep server actions responsible for authorization, validation, mutations that must
  complete before responding, and sending events. Keep asynchronous work in Inngest.
- Do not edit `package.json` or `tsconfig.json` for an Inngest function without
  explicit user approval.

## Creating a function

Use a stable, descriptive function `id` and an event name in the
`domain/noun.verb` format. Event names describe something that happened and use
past tense. Never change a deployed function ID or step ID without considering
Inngest's memoized step state and migration behavior.

```ts
import prisma from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";

export const publishAnnouncement = inngest.createFunction(
  {
    id: "announcement-publish",
    triggers: [{ event: "announcement/scheduled" }],
    retries: 4,
    idempotency: "event.data.announcementId",
  },
  async ({ event, step }) => {
    const targetDate = new Date(event.data.scheduleDate);

    if (Number.isNaN(targetDate.getTime())) {
      return { skipped: true, reason: "invalid-schedule-date" };
    }

    await step.sleepUntil("wait-until-scheduled-time", targetDate);

    await step.run("publish-announcement", async () => {
      await prisma.announcement.update({
        where: { id: event.data.announcementId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          scheduledFor: null,
        },
      });
    });

    return { announcementId: event.data.announcementId };
  },
);
```

Use `triggers: [{ event: "..." }]` for new functions. A cron trigger can be used
when the work is time-based rather than event-based:

```ts
export const sendDailySummary = inngest.createFunction(
  {
    id: "send-daily-summary",
    triggers: [{ cron: "0 9 * * *" }],
  },
  async ({ step }) => {
    return step.run("send-summary", () => sendSummaryEmails());
  },
);
```

## Durable steps

Each step is independently retried and memoized. Put all non-deterministic work
inside steps:

- Prisma reads and writes
- network requests and email delivery
- file storage operations
- timestamps, random values, and other runtime-dependent values
- logging that must happen once per completed step

Keep pure validation and deterministic transformations outside steps. Do not put
database calls, API calls, or `Date.now()` outside a step.

```ts
export const processRegistration = inngest.createFunction(
  {
    id: "student-process-registration",
    triggers: [{ event: "student/registration.approved" }],
    idempotency: "event.data.studentId + '-' + event.data.semesterId",
  },
  async ({ event, step }) => {
    const registration = await step.run("load-registration", () =>
      prisma.registration.findUnique({
        where: {
          studentId_semesterId: {
            studentId: event.data.studentId,
            semesterId: event.data.semesterId,
          },
        },
        select: { studentId: true, semesterId: true, status: true },
      }),
    );

    if (!registration || registration.status !== "APPROVED") {
      return { skipped: true, reason: "registration-not-approved" };
    }

    await step.run("create-fee-record", () =>
      prisma.studentSemesterFee.upsert({
        where: {
          studentId_semesterFeeId: {
            studentId: registration.studentId,
            semesterFeeId: event.data.semesterFeeId,
          },
        },
        create: {
          studentId: registration.studentId,
          semesterFeeId: event.data.semesterFeeId,
          totalDue: event.data.totalDue,
          status: "PENDING",
        },
        update: {},
      }),
    );

    return { processed: true };
  },
);
```

Reuse step IDs for repeated calls in a loop; Inngest handles step counters. Keep
step output small: each step has a 4 MB output limit and a function run has a
32 MB state limit. Split large workflows into multiple functions when needed.

## Sending or creating an event

From a server action, route handler, or other request code, send an event with the
shared client. Validate and authorize before sending. Include all identifiers the
consumer needs and use an event ID for deduplication when duplicate sends are
possible.

```ts
import { inngest } from "@/lib/inngest/client";

await inngest.send({
  id: `announcement-scheduled-${announcementId}`,
  name: "announcement/scheduled",
  data: {
    announcementId,
    scheduleDate: scheduledFor.toISOString(),
  },
});
```

For several independent consumers, send one event and let multiple functions
subscribe to it. For a batch, send an array of event payloads:

```ts
await inngest.send(
  studentIds.map((studentId) => ({
    id: `fee-record-create-${studentId}-${semesterFeeId}`,
    name: "fee/student-record.create",
    data: { studentId, semesterFeeId },
  })),
);
```

Inside an Inngest function, use `step.sendEvent()` rather than `inngest.send()`.
This makes the event send part of the durable workflow:

```ts
await step.sendEvent("dispatch-fee-records", [
  ...studentIds.map((studentId) => ({
    name: "fee/student-record.create",
    data: { studentId, semesterFeeId },
  })),
]);
```

## Invoking another function

Use `step.invoke()` when the parent workflow needs the child function's returned
value. The child function must be imported and passed as a function reference.
Use `step.sendEvent()` when the parent only needs to dispatch work and does not
need a result.

```ts
import { inngest } from "@/lib/inngest/client";
import { generateStudentReport } from "@/lib/inngest/generate-student-report";

export const prepareStudentReport = inngest.createFunction(
  {
    id: "student-prepare-report",
    triggers: [{ event: "student/report.requested" }],
  },
  async ({ event, step }) => {
    const report = await step.invoke("generate-report", {
      function: generateStudentReport,
      data: {
        studentId: event.data.studentId,
        requestedBy: event.data.requestedBy,
      },
    });

    await step.run("notify-report-ready", () =>
      notifyReportReady({
        studentId: event.data.studentId,
        reportId: report.reportId,
      }),
    );

    return { reportId: report.reportId };
  },
);
```

The invoked function is still registered in `app/api/inngest/route.ts`. Keep
function modules independent to avoid circular imports. A typical split is:

- `lib/inngest/generate-student-report.ts` — child function
- `lib/inngest/functions.ts` — orchestration and existing functions
- `app/api/inngest/route.ts` — the complete function registry

## Errors, retries, and idempotency

- A failed step is retried according to the function's `retries` setting.
- Throw ordinary errors for transient failures that should retry.
- Use `NonRetriableError` for permanent, validated business failures that should
  stop immediately.
- Use idempotent database writes such as Prisma `upsert` for retried work.
- Add function-level `idempotency` for one-per-entity processing.
- Never silently swallow a failed external call or database operation.
- Do not use `throw new Error(...)` in server actions; return the project's
  `ApiResponseType`. Throwing inside a function step is appropriate when Inngest
  should retry the work.

```ts
import { NonRetriableError } from "inngest";

await step.run("load-user", async () => {
  const user = await prisma.user.findUnique({
    where: { id: event.data.userId },
  });

  if (!user) {
    throw new NonRetriableError("User does not exist.");
  }

  return user;
});
```

## Registration and local verification

After creating a function, add it to the route registry:

```ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { publishAnnouncement, sendDailySummary } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [publishAnnouncement, sendDailySummary],
});
```

Run the Next.js app and the repository's Inngest development server with
`pnpm inngest:dev`. Verify the function appears in the Inngest dashboard, then
send a representative event from an authorized server action or request path.
Do not invoke Inngest functions by calling their handler directly.
