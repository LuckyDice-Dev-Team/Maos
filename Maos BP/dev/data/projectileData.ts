import { ProjectileData, ProjectileFunction, ProjectileKey } from "../type/projectileType";
import { JobType } from "./jobData";
import { dimensions } from "../system";

const projectileDatas = {
    ice_magician: {
        1: {
            key: "ice_magician:1",
            offset: {
                x: 0,
                y: 0.125,
                z: 0,
            },
            moveDisPerLoop: 1.5,
            life: 20,
            entityPenetrateRemain: 0,
            blockPenetrateRemain: { "minecraft:glass": 1 },
        } as ProjectileData,
    },
};

export const getProjectileData = (jobType: JobType, key: keyof (typeof projectileDatas)[JobType]) => {
    const projectileData = projectileDatas[jobType][key];
    if (!projectileData) {
        throw new Error(`Unknown key - ${jobType} ${key}`);
    }

    return projectileData;
};

export const projectileFunctions: {
    [key in ProjectileKey]: ProjectileFunction;
} = {
    "ice_magician:1": {
        onTick: ({ dimensionId, location }) => {
            const dimension = dimensions[dimensionId];
            dimension.spawnParticle("maos:ice_magician_1_tick1", location);
            dimension.spawnParticle("maos:ice_magician_1_tick2", location);
            dimension.spawnParticle("maos:ice_magician_1_tick3", location);

            return false;
        },
        checkHit: () => [],
        onHit: () => false,
    },
} as const;
