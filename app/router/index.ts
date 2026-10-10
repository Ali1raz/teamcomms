import { generateCompose, generateThreadSummary } from "./ai";
import { getInvitionDEtails } from "./invitations";
import { inviteMember } from "./members";
import {
  createMessage,
  deleteMessage,
  listMessages,
  listThreads,
  toggleReaction,
  updateMessage,
} from "./message";
import {
  cancelOrganizationInvitation,
  createOrganization,
  leaveOrganization,
  listOrganizationInvitations,
  listOrganizationMembers,
  listOrganizations,
  removeOrganizationMember,
  updateOrganization,
  updateOrganizationMemberRole,
} from "./organization";
import {
  addMembersToTeam,
  createTeam,
  deleteTeam,
  getTeam,
  listTeamMembers,
  listTeams,
  removeMemberFromTeam,
  updateTeam,
} from "./team";
import { getCurrentUser } from "./user";

export const router = {
  user: {
    get: getCurrentUser,
  },
  organization: {
    list: listOrganizations,
    create: createOrganization,
    update: updateOrganization,
    leave: leaveOrganization,
    members: {
      invite: inviteMember,
      list: listOrganizationMembers,
      updateRole: updateOrganizationMemberRole,
      remove: removeOrganizationMember,
    },
    invitations: {
      list: listOrganizationInvitations,
      cancel: cancelOrganizationInvitation,
    },
  },
  team: {
    create: createTeam,
    list: listTeams,
    get: getTeam,
    update: updateTeam,
    delete: deleteTeam,
    members: {
      list: listTeamMembers,
      add: addMembersToTeam,
      remove: removeMemberFromTeam,
    },
  },
  message: {
    create: createMessage,
    list: listMessages,
    update: updateMessage,
    delete: deleteMessage,
    threads: {
      list: listThreads,
    },
    reaction: {
      toggle: toggleReaction,
    },
  },
  ai: {
    compose: {
      generate: generateCompose,
    },
    threads: {
      summary: {
        generate: generateThreadSummary,
      },
    },
  },
  invitation: {
    get: getInvitionDEtails,
  },
};
