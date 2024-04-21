import { Entity } from "@minecraft/server";
import { jobPropertyValues, systemPropertyValues } from "../data/propertyData";
import { jobs, JobType } from "../data/jobData";
import { systemTagValues, TeamTag } from "../data/tag";

export const getJobType = (entity: Entity) => {
    return entity.getDynamicProperty(jobPropertyValues.job) as JobType | undefined;
};

export const setJob = (entity: Entity, jobType: JobType | undefined) => {
    console.warn(`Set job ${entity.nameTag} ${jobType}`);

    if (!getTeam(entity)) {
        console.warn("직업 설정 전, 팀 지정부터 해주세요");
        return;
    }

    entity.setDynamicProperty(jobPropertyValues.job, jobType);

    if (jobType) {
        const job = jobs[jobType];

        entity.addTag(systemTagValues.game);

        entity.removeEffect("health_boost");
        entity.addEffect("health_boost", 20000000, {
            amplifier: 44,
            showParticles: false,
        });

        job.setHp(entity, job.getMaxHp(entity));
        job.setMn(entity, job.getMaxMn(entity));
    } else {
        entity.removeTag(systemTagValues.game);
    }
};

export const getTeam = (entity: Entity) => {
    return entity.getDynamicProperty(systemPropertyValues.team) as TeamTag | undefined;
};

export const setTeam = (entity: Entity, team: TeamTag | undefined) => {
    console.warn(`Set team ${entity.nameTag} ${team}`);

    const originalTeam = getTeam(entity);
    if (originalTeam) {
        entity.removeTag(originalTeam);
    }

    entity.setDynamicProperty(systemPropertyValues.team, team);
    if (team) {
        entity.addTag(team);
    }
};
