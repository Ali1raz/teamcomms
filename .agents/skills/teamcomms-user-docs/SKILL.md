---
name: teamcomms-user-docs
description: Write and review Teamcomms end-user documentation. Use when creating or editing help articles, how-to guides, onboarding pages, FAQs, or troubleshooting content for non-technical Teamcomms users, or when documenting organizations, teams, invitations, members, permissions, or messages.
---

Write help that lets a non-technical person finish a Teamcomms task without asking for help. Accuracy beats completeness. A short, verified article is better than a long, guessed one.

## Workflow

1. **Name the feature and the user goal.** Ask which Teamcomms feature to document if it is not stated. For example, "invite someone to an organization" or "leave an organization". Do not draft until the feature and audience are clear.
   Done when: you can state the goal in one sentence, in the user's words.

2. **Verify the feature in the current app.** Check the running app, routes, and schema before writing. Treat the app as the source of truth, not this skill and not the feature's plan. When behavior is unclear, ask instead of guessing.
   Done when: every button, label, permission, and outcome you plan to mention has been confirmed.

3. **Outline by user goal.** List the title, the result, the prerequisites, and the steps in order. Keep one goal per article. Link related guides instead of merging them.
   Done when: no step depends on a feature you could not verify.

4. **Draft with the article template.** Use `reference/article-template.md`. Open with what the reader will do and why it matters, then the steps, then what happens next. Address the reader as "you".
   Done when: a first-time user can follow every step without outside knowledge.

5. **Run the accuracy and style checks.** Use `reference/style-and-checklist.md`. Confirm roles, access changes, terminology, and that no unimplemented feature is presented as available.
   Done when: every checklist item passes.

## Product model

Read `reference/product-model.md` before writing about organizations, teams, invitations, membership, permissions, or messages. It records what the current app supports and which features still need verification.

## Writing rules

- Lead with the action, then explain. Use short sentences and plain English.
- Explain a product term the first time you use it.
- Use "organization", "team", and "member" consistently. They are not interchangeable.
- Explain access in user terms: who can see what, and what changes when membership changes.
- Mention a permission only when it changes what the reader can do.
- Warn the reader before a destructive or irreversible action.
- Never invent a button, menu, setting, permission, message state, or feature.
- Do not use em dashes. Use periods, commas, or parentheses.
- Cut anything that does not help the reader finish the task.

## Reference

- `reference/product-model.md`: verified product model; read before describing access or membership.
- `reference/article-template.md`: MDX frontmatter, article skeleton, and step patterns.
- `reference/style-and-checklist.md`: tone, terminology, screenshots, FAQ rules, and the pre-publish checklist.
