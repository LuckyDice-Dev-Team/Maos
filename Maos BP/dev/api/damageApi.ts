import { Entity, EntityDamageCause, world } from "@minecraft/server";
import { getJobType } from "./jobApi";
import { jobs } from "../data/jobData";

export const damageById = (value: number, sourceId: string, targetId: string) => {
    const target = world.getEntity(targetId);
    const source = world.getEntity(sourceId);

    damage(value, source, target);
};

export const damage = (value: number, source?: Entity, target?: Entity) => {
    if (!source || !target) {
        console.warn("Tried to damage to undefined");
        return;
    }

    const jobType = getJobType(target);
    if (!jobType) {
        return;
    }

    target.applyDamage(1, {
        cause: EntityDamageCause.entityAttack,
    });

    const job = jobs[jobType];
    job.setHp(target, job.getHp(target) - value);
};
