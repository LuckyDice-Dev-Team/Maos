import { system } from "@minecraft/server";
import { overworld } from "../system";
import { systemTagValues } from "../data/tag";
import { getJobType } from "../api/jobApi";
import { jobs } from "../data/jobData";

system.runInterval(() => {
    overworld.getPlayers({ tags: [systemTagValues.game] }).forEach((player) => {
        const jobType = getJobType(player);
        if (!jobType) {
            return;
        }

        const job = jobs[jobType];

        const currentHp = job.getHp(player);
        const maxHp = job.getMaxHp(player);
        if (currentHp < maxHp) {
            const hpRegen = job.getHpRegen(player);

            console.warn(`set hp ${currentHp + hpRegen}`);
            job.setHp(player, Math.min(maxHp, currentHp + hpRegen));
        }

        const currentMn = job.getMn(player);
        const maxMn = job.getMaxMn(player);
        if (currentMn < maxMn) {
            const mnRegen = job.getMnRegen(player);

            console.warn(`set mn ${currentMn + mnRegen}`);
            job.setMn(player, Math.min(maxMn, currentMn + mnRegen));
        }
    });
}, 20);
