import { convertListToObject } from "../utils/objectUtils";

const systemProperties = ["log", "projectile", "team"] as const;
export type SystemProperty = (typeof systemProperties)[number];
export const systemPropertyValues = convertListToObject(systemProperties);

const jobProperties = ["job"] as const;
export const jobPropertyValues = convertListToObject(jobProperties);

const coolRemainProperties = ["remain_left", "remain_right", "remain_1", "remain_2", "remain_3", "remain_4"] as const;
export type CoolRemainProperty = (typeof coolRemainProperties)[number];

const coolTimeoutProperties = ["timeout_left", "timeout_right", "timeout_1", "timeout_2", "timeout_3", "timeout_4"];
export type CoolTimeoutProperty = (typeof coolTimeoutProperties)[number];

const statProperties = ["hp", "mn"] as const;
export const statPropertyValues = convertListToObject(statProperties);

const buffProperties = ["debuffCount"] as const;
export const buffPropertyValues = convertListToObject(buffProperties);
