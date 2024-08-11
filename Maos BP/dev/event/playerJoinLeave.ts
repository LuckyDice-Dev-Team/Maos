import { Player, system, world } from "@minecraft/server";
import { getJobType } from "../api/jobApi";
import { jobs } from "../data/jobData";
import { debuffPropertyValues, shieldPropertyValues, statPropertyValues } from "../data/propertyData";
import { getShield, setShield } from "../api/shieldApi";
import { getDebuffTime, setDebuff } from "../api/buffApi";
import { initPlayer, INTERVAL_KEYS } from "../api/initApi";

world.afterEvents.playerJoin.subscribe(({ playerId }) => {
    initPlayer(playerId);
});

world.beforeEvents.playerLeave.subscribe(({ player }) => {
    const jobType = getJobType(player);
    if (!jobType) {
        return;
    }

    INTERVAL_KEYS.forEach((key) => {
        const interval = player.getDynamicProperty(key);
        if (interval) {
            system.clearRun(interval as number);
        }
    });
});
