import { Entity } from "@minecraft/server";
import { jobPropertyValues } from "../data/propertyData";
import { JobType } from "../data/jobData";

export const getJob = (entity: Entity) => {
    return entity.getDynamicProperty(jobPropertyValues.job) as JobType | undefined;
};

export const setJob = (entity: Entity, job: JobType | undefined) => {
    console.warn(`Set Job`, entity.nameTag, job);
    entity.setDynamicProperty(jobPropertyValues.job, job);
};
