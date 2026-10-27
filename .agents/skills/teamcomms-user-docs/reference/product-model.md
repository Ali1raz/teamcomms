# Teamcomms product model

Use this model when writing end-user docs. It reflects the app as verified in October 2026. The running app is the source of truth. Verify a feature before you document it.

## Users

- A user has one account and can belong to more than one organization.
- A user can belong to more than one team within an organization.
- A user's access depends on their current organization and team memberships.

## Organizations

- An organization is a workspace for a company, business, or group.
- Any signed-in user can create an organization. The creator becomes the owner.
- Organization members have one role: owner, admin, or member.
- Owners and admins can update the organization, manage member roles, invite people, cancel invitations, remove members, and create, update, or delete teams.
- Members can use the organization and its teams but cannot manage members or teams.
- A user can leave an organization. Leaving removes their access to that organization and its teams. Their access to other organizations does not change.
- The owner cannot be removed from the organization.

## Teams

- A team belongs to one organization and is not shared across organizations.
- Owners and admins can create, rename, or delete a team.
- Owners and admins can add organization members to a team or remove them from a team.
- A user can be a member of several teams in the same organization.
- Team conversations and messages are available only to that team's members.

## Invitations

- Owners and admins invite people by email address to an organization.
- An invitation can optionally assign the person to a team.
- An invitation expires. The app shows the expiry date.
- The invited person can accept or reject the invitation from the invitation page.
- Owners and admins can cancel a pending invitation.
- Accepting an organization invitation makes the person an organization member. Team access is granted only when the invitation includes a team or someone adds them to a team later.
- Organization membership alone does not grant access to every team.

## Membership and access

- Organization membership and team membership are separate.
- Leaving a team is not the same as leaving an organization. A user is removed from a team by an owner or admin.
- Leaving an organization removes access to that organization's content.
- Removing someone from a team removes their access to that team's conversations. Their organization membership stays unless someone also removes them from the organization.
- Explain access changes as visible outcomes: what the person can open, and what they can no longer open.

## Messages

- Messages belong to a team. There is no separate organization-wide channel in the current app.
- Team members can send messages, edit their own messages, and delete their own messages.
- Messages can include an image attachment.
- Messages can have replies and emoji reactions.

## Verify before documenting

Confirm these in the running app before you mention them, because they are not part of the verified model above:

- Organization-wide channels or any channel model.
- Message search, message pinning, or saved messages.
- Notifications, unread counts, or notification settings.
- Invitation behavior such as resending, extending, or accepting without an account.
- Any file attachment type other than images.
- Any role beyond owner, admin, and member.
