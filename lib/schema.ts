import z from "zod/v3";

export const updateTeamSchema = z.object({
  organizationId: z.string().min(1, "Organization id is required"),
  name: z
    .string()
    .trim()
    .min(2, "Team name must be greater than 2 chars")
    .max(20, "Team name must be less than 20 chars"),
  teamId: z.string().min(1, "Team id is required"),
});

export type UpdateTeamType = z.infer<typeof updateTeamSchema>;
