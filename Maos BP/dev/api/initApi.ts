import {
    debuffPropertyValues,
    debuffTimeoutPropertyValues,
    shieldPropertyValues,
    statPropertyValues,
    valuedDebuffPropertyValues,
    valuedDebuffTimeoutPropertyValues,
} from "../data/propertyData";
import { Player, system, world } from "@minecraft/server";
import { getJobType } from "./jobApi";
import { jobs } from "../data/jobData";
import { getShield, setShield } from "./shieldApi";
import { applyDebuff, applyValuedDebuff, getDebuffTime, valuedDebuffActionMap } from "./buffApi";

export const INTERVAL_KEYS = [
    statPropertyValues.hpInterval,
    statPropertyValues.mnInterval,
    shieldPropertyValues.shieldInterval,
    shieldPropertyValues.shieldParticleInterval,

    // DEBUFF
    debuffPropertyValues.pin,
    debuffPropertyValues.stun,
    debuffTimeoutPropertyValues.pinTimeout,
    debuffTimeoutPropertyValues.stunTimeout,

    // Valued Debuff
    valuedDebuffPropertyValues.slow,
    valuedDebuffTimeoutPropertyValues.slowTimeout,
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

    applyDebuff(player, "pin", getDebuffTime(player, "pin"));
    applyDebuff(player, "stun", getDebuffTime(player, "stun"));
    valuedDebuffActionMap.getOrThrow("slow")(player, 0, 0);
};
