import { debuffPropertyValues, shieldPropertyValues, statPropertyValues } from "../data/propertyData";
import { Player, system, world } from "@minecraft/server";
import { getJobType } from "./jobApi";
import { jobs } from "../data/jobData";
import { getShield, setShield } from "./shieldApi";
import { getDebuffTime, setDebuff } from "./buffApi";

export const INTERVAL_KEYS = [
    statPropertyValues.hpInterval,
    statPropertyValues.mnInterval,
    shieldPropertyValues.shieldInterval,
    shieldPropertyValues.shieldParticleInterval,
    debuffPropertyValues.pin,
    debuffPropertyValues.stun,
] as const;

export const initPlayer = (playerId: string) => {
    const player = world.getEntity(playerId) as Player;
    const jobType = getJobType(player);
    if (!jobType) {
        return;
    }

    INTERVAL_KEYS.forEach((key) => {
        const property = player.getDynamicProperty(key);

        if (property) {
            player.setDynamicProperty(key, undefined);

            if (key.includes("Interval")) {
                system.clearRun(property as number);
            }
        }
    });

    const job = jobs[jobType];
    job.setHp(player, job.getHp(player));
    job.setMn(player, job.getMn(player));
    setShield(player, getShield(player));
    setDebuff(player, debuffPropertyValues.pin, getDebuffTime(player, debuffPropertyValues.pin));
    setDebuff(player, debuffPropertyValues.stun, getDebuffTime(player, debuffPropertyValues.stun));
};
