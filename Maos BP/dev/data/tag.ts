import { convertListToObject } from "../utils/objectUtils";

const systemTags = ["game"] as const;
export const systemTagValues = convertListToObject(systemTags);

const teamTags = ["blue", "red"] as const;
export type TeamTag = (typeof teamTags)[number];
export const teamTagValues = convertListToObject(teamTags);
