import { convertListToObject } from "./utils/objectUtils";

const systemProperties = ["log", "projectile"] as const;
export type SystemProperty = (typeof systemProperties)[number];
export const systemPropertyValues = convertListToObject(systemProperties);

const jobProperties = ["job"] as const;
export type JobProperty = (typeof jobProperties)[number];
export const jobPropertyValues = convertListToObject(jobProperties);
