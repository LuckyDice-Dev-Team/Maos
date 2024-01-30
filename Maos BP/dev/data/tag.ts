import { convertListToObject } from "../utils/objectUtils";

const systemTags = ["game", "team_blue", "team_red"] as const;
export const systemTagValues = convertListToObject(systemTags);

const teamTags = ["blue", "red"] as const;
export type TeamTag = (typeof teamTags)[number];
export const teamTagValues = convertListToObject(teamTags);
