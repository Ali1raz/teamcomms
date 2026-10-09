import { streamToEventIterator } from "@orpc/server";
import { streamText } from "ai";
import z from "zod/v3";
import { sensitiveInfoAj } from "@/lib/arcjet-helpers";
import { model, openrouter } from "@/lib/open-router";
import { prisma } from "@/lib/prisma";
import { formatLocalDateTime, jsonToMarkdown } from "@/lib/utils";
import { aiMiddleware } from "../middlewares/ai-aj";
import { requireAuthMiddleware } from "../middlewares/auth";
import { base } from "../middlewares/bast";
import { requireOrganizationMiddleware } from "../middlewares/organization";

export const generateThreadSummary = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(aiMiddleware)
  .route({
    method: "GET",
    path: "/ai/threads/summary",
    summary: "Generate a summary of the thread",
    tags: ["ai"],
  })
  .input(
    z.object({
      threadId: z.string(),
    })
  )
  .handler(async ({ input, context, errors }) => {
    const parentMessage = await prisma.message.findFirst({
      where: {
        threadId: input.threadId,
        team: {
          organizationId: context.organization.id,
        },
      },
      select: {
        id: true,
        threadId: true,
        teamId: true,
      },
    });

    if (!parentMessage) {
      throw errors.NOT_FOUND();
    }

    const threadId = parentMessage.threadId ?? parentMessage.id;

    const parent = await prisma.message.findFirst({
      where: {
        id: threadId,
        team: {
          organizationId: context.organization.id,
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          orderBy: {
            createdAt: "desc", // newest replies first
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw errors.NOT_FOUND();
    }

    const replies = parent.replies.slice().reverse();

    const parentText = await jsonToMarkdown(parent.content);

    const lines = [];

    lines.push(
      `Thread root - ${parent.user.name} - ${formatLocalDateTime(parent.createdAt)}`
    );

    lines.push(parentText);

    if (replies.length > 0) {
      lines.push("---");
      for (const reply of replies) {
        const replyText = await jsonToMarkdown(reply.content);
        lines.push(
          `${reply.user.name} - ${formatLocalDateTime(reply.createdAt)}: ${replyText}`
        );
      }
    }

    const compiled = lines.join("\n");
    console.log("=========");
    console.log("Replies", replies.length);

    console.log("compiled", compiled);
    console.log("=========");

    // Run PII check here because middleware cannot access the parsed/compiled text.
    // This prevents sensitive data (CC numbers, phone numbers) from being sent to the AI.
    const sensitiveDecision = await sensitiveInfoAj().protect(context.request, {
      userId: context.user.id,
      sensitiveInfoValue: compiled,
    });

    if (sensitiveDecision.isDenied()) {
      if (sensitiveDecision.reason.isSensitiveInfo()) {
        throw errors.FORBIDDEN({
          message:
            "Sensitive information detected. Please remove PII (e.g. credit card numbers, phone numbers) and try again!",
        });
      }

      throw errors.FORBIDDEN({
        message: "Request blocked!",
      });
    }

    const result = streamText({
      model: openrouter(model),
      system: `You are an export assisstant summarizing SLack-like discussion threads for product team.
        Use only provuded thread content, dont invent facts, names or timelines
        Output format (Markdown):
        - first, write a single concise paragraph (2-4 sentences) that captures the thread's purpose, key dicisions,  context and any blockers or nxt steps, no heading, no list, no intro text
        Then add black line followed by exactly 2-3 bullet points (using -) withthe most imporant takeaways, each line is one sentence
        style: neutral, specific and concise. Preserve terminology, names, or acronyms. avoid filler or meta-commentary, dont add closing sentance.
        - if the context is insufficent, return a signle sentance summary and omit the bullet list`,
      messages: [{ role: "user", content: compiled }], // single-turn — compiled prompt already contains all context (history, instructions, data), no need for multi-message conversation format
      temperature: 0.2, // low temperature for consistent, deterministic output; avoids hallucinations in structured/factual responses — raise to 0.7+ for creative tasks
    });

    return streamToEventIterator(result.toUIMessageStream());
  });

export const generateCompose = base
  .use(requireAuthMiddleware)
  .use(requireOrganizationMiddleware)
  .use(aiMiddleware)
  .route({
    method: "GET",
    path: "/ai/compose/generate",
    summary: "Generate a message",
    tags: ["ai"],
  })
  .input(
    z.object({
      content: z.string(),
    })
  )
  .handler(async ({ input, context, errors }) => {
    const markdown = await jsonToMarkdown(input.content);

    // Check user-provided content for sensitive info before sending to AI
    const sensitiveDecision = await sensitiveInfoAj().protect(context.request, {
      userId: context.user.id,
      sensitiveInfoValue: markdown,
    });

    if (sensitiveDecision.isDenied()) {
      if (sensitiveDecision.reason.isSensitiveInfo()) {
        throw errors.FORBIDDEN({
          message:
            "Sensitive information detected. Please remove PII (e.g. credit card numbers, phone numbers) and try again!",
        });
      }

      throw errors.FORBIDDEN({
        message: "Request blocked!",
      });
    }

    const result = streamText({
      model: openrouter(model),
      system: `You are a expert rewriting assisstant, you are not a chatbot.
Task: rewrite the following message to improve its clarity and better structure while preserving its original meaning, facts, terminologies and names.
Do not address the user, ask questions, add greetings, or include commentary
keep existing links/mentions intact, dont change code blocks or inline code content
output strictly in markdown (paragraphs and optional bullet lists), do not output any HTML or images.
return only rewritter content, no preamble, headings, or closing remarks`,
      messages: [
        {
          role: "user",
          content: "Please rewrite and improve the following message",
        },
        {
          role: "user",
          content: markdown,
        },
      ],
      temperature: 0.2,
    });

    return streamToEventIterator(result.toUIMessageStream());
  });
