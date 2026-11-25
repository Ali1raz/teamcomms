# PRD: Delete User Account

## Problem Statement

Users have no self-service way to delete their account. Today a user who wants to leave TeamComms must contact an administrator or leave their data behind, and there is no path that anonymizes their profile or removes their access while preserving conversation history. The feature must let a user request deletion, cancel within a short window, and end with an anonymized, deactivated account without losing message context for other members.

## Solution

A user can request account deletion from their profile. The request immediately anonymizes their profile (name becomes "Deleted User #XXXX" using the last four characters of their user id; avatar and other profile info cleared), revokes all sessions, and removes them from organizations and teams. The account is marked as pending deletion and a 4-day cancel window opens. An Inngest job is scheduled to finalize the deletion at the end of that window. During the window the user can sign in to a restricted state and cancel via an explicit "Cancel deletion" action, which restores their profile from a stored snapshot and reactivates the account. After the window elapses the scheduled job marks the account deleted and performs final cleanup. Messages and replies are never removed; their author displays as "Deleted User #XXXX". Users may still delete their own messages and replies individually at any time.

## User Stories

1. As a user, I want to request account deletion from my profile, so that I can leave the platform without contacting support.
2. As a user, I want my username, avatar, and profile info replaced with "Deleted User #XXXX" immediately on request, so that my identity is not visible to others during the cancel window.
3. As a user, I want all my sessions revoked immediately on deletion request, so that no device stays signed in after I decide to leave.
4. As a user, I want a 4-day window to change my mind, so that an accidental or impulsive deletion can be undone.
5. As a user, I want to cancel deletion through an explicit button, so that cancellation is deliberate and not triggered by an incidental login.
6. As a user, I want my original profile restored if I cancel, so that cancellation fully reverts the request.
7. As a user, I want my messages and replies to remain after deletion, so that conversations keep their context.
8. As a user, I want my messages and replies to show "Deleted User #XXXX" as the author after deletion, so that authorship is anonymized.
9. As a user, I want to delete my own messages and replies individually at any time, so that I can remove specific content before or after requesting account deletion.
10. As an organization owner, I want to be blocked from deleting my account while I am the sole owner of an organization, so that no organization is left without an owner.
11. As an organization owner, I want guidance to transfer ownership before deletion, so that I know what to do to proceed.
12. As a user, I want to be removed from all organizations and teams on deletion request, so that I no longer have access to their content.
13. As a user, I want pending invitations I sent or received handled on deletion, so that no dangling invitations remain.
14. As an admin viewing a conversation, I want deleted authors to display consistently as "Deleted User #XXXX", so that the UI does not break on missing user data.
15. As a user signing in during the cancel window, I want a restricted view offering cancellation, so that I can recover my account.
16. As a user, I want confirmation before deletion is requested, so that I do not trigger it accidentally.
17. As a user, I want to see the scheduled final deletion date, so that I know how long I have to cancel.
18. As a user, I want cancellation to abort the scheduled finalization, so that no background job completes after I cancel.
19. As a user, I want repeated deletion requests to be idempotent, so that double-clicks or retries do not create duplicate jobs.
20. As a developer, I want deletion processed by a durable background job, so that finalization survives server restarts and retries safely.

## Implementation Decisions

- Add a user status concept (active, pending_deletion, deleted) plus `deletionRequestedAt` and `deletionScheduledAt` timestamps on the user record. Store a profile snapshot (original name, image, and email) in a deletion request record so cancellation can restore the profile.
- Anonymize the profile immediately on request: set name to "Deleted User #XXXX" (last four characters of the user id), clear image and other profile fields, and mark status pending_deletion. Do not hard-delete the user row, because messages reference it.
- Revoke all sessions immediately on request and remove the user from all organization memberships, team memberships, and pending invitations.
- Block the request if the user is the sole owner of any organization; require ownership transfer first. Detect by checking organizations where the user is the only member with the owner role.
- Schedule finalization with an Inngest delayed function keyed to the user, set to run at `deletionRequestedAt + 4 days`. The function must be idempotent and must re-check status before acting.
- Finalization marks status deleted, ensures the profile is anonymized, removes any remaining sessions/memberships/invitations, and is a no-op if the account was already cancelled or deleted.
- Cancellation is an explicit action that sets status back to active, restores profile fields from the snapshot, clears deletion timestamps, and cancels the scheduled Inngest run. Login alone does not cancel deletion.
- Allow authentication of pending_deletion accounts but restrict the UI to a cancellation screen; do not grant access to organizations, teams, or conversations.
- Messages and reactions remain untouched; display logic resolves the author name from the user record, which already reads "Deleted User #XXXX" after anonymization.
- Manual deletion of own messages and replies continues to use the existing message deletion path; no change to message ownership rules.
- Use the existing server-action pattern for request and cancellation, with session checks consistent with the profile actions.
- Add the deletion request and cancel controls to the profile area.
- Reuse the existing Inngest client and function registration; add the new function to the registered list.

## Testing Decisions

- Test external behavior only: given a user, requesting deletion produces an anonymized profile, revoked sessions, removed memberships, a pending status, a scheduled timestamp, and a scheduled job; cancellation restores the profile and active status and prevents finalization; finalization is idempotent and a no-op after cancellation.
- Test the sole-owner guard: deletion request fails for a user who is the only owner of an organization and succeeds after ownership transfer.
- Test that messages remain and their author resolves to "Deleted User #XXXX" after deletion.
- There is no existing test suite for app code in this repository, so these tests should be added as new unit/integration tests alongside the service modules, using the repository's chosen test runner.

## Out of Scope

- Hard deletion of messages or replies as part of account deletion (messages are retained and anonymized).
- Automatic transfer or deletion of organizations owned by the deleting user.
- Email notifications about deletion or cancellation (may be added later).
- Admin-initiated deletion of other users' accounts.
- Data export before deletion.
- Changes to message-level permissions beyond existing own-message deletion.

## Further Notes

- The 4-day window and immediate anonymization follow the project's existing soft-delete/anonymization intent: "deleting" an account is deactivation, not removal.
- "Deleted User #XXXX" uses the last four characters of the user id for uniqueness without a new counter.
- The cancel window is 4 days (approximately; exact duration configurable).
