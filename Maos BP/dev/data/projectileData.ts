import { CheckHitOption, Projectile, ProjectileData, ProjectileFunction, ProjectileType } from "../type/projectileType";
import { JobType } from "./jobData";
import { dimensions, overworld } from "../system";
import { Vector, Vector3 } from "@minecraft/server";
import { calcVectorLength, calcVectors } from "../utils/mathUtils";
import OptionalMap from "../object/optionalMap";
import { TeamTag } from "./tag";

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
            entityPenetrateRemain: 1,
            blockPenetrateRemain: {
                "minecraft:glass": 1,
            },
            maxHitPerOnce: 1,
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

const getDefaultCheckHit = (options: CheckHitOption) => {
    return function ({ location: startLocation, team, summoner }: Projectile, endLocation: Vector3) {
        const payload: string[] = [];
        const distanceMap = new OptionalMap<string, number>();

        const lineVector = calcVectors(startLocation, endLocation, (x, y) => y - x);
        const totalDistance = calcVectorLength(lineVector);
        const normalizedLineVector = Vector.divide(lineVector, totalDistance);

        const midLocation = calcVectors(startLocation, endLocation, (v1, v2) => (v2 + v1) / 2);
        const excludeTags: TeamTag[] = [];

        if (!options.includeAlly) {
            excludeTags.push(team);
        }
        if (!options.includeEnemy) {
            excludeTags.push(team === "blue" ? "red" : "blue");
        }

        const possibleEntities = overworld.getEntities({
            excludeTags,
            location: midLocation,
            maxDistance: totalDistance / 2 + options.radius,
        });

        if (!possibleEntities.length) {
            return [];
        }

        for (const entity of possibleEntities) {
            if (!options.includeSelf && entity.id === summoner) {
                continue;
            }

            const entityLocation = { ...entity.location };
            entityLocation.y += 0.9375;

            const tempVector = Vector.cross(
                calcVectors(entityLocation, startLocation, (v1, v2) => v1 - v2),
                normalizedLineVector,
            );

            const distanceToLine = calcVectorLength(tempVector) / calcVectorLength(normalizedLineVector);
            if (distanceToLine <= options.radius) {
                distanceMap.set(entity.id, Vector.distance(entity.location, startLocation));
                payload.push(entity.id);
            }
        }

        return payload.sort((a, b) => distanceMap.getOrThrow(a) - distanceMap.getOrThrow(b));
    };
};

export const projectileFunctions: {
    [key in ProjectileType]: ProjectileFunction;
} = {
    "ice_magician:1": {
        onTick: ({ dimensionId, location }) => {
            const dimension = dimensions[dimensionId];
            dimension.spawnParticle("maos:ice_magician_1_tick1", location);
            dimension.spawnParticle("maos:ice_magician_1_tick2", location);
            dimension.spawnParticle("maos:ice_magician_1_tick3", location);

            return false;
        },
        checkHit: getDefaultCheckHit({
            radius: 1.3,
            includeSelf: false,
            includeAlly: false,
            includeEnemy: true,
        }),
        onHit: (_projectile, targets) => {
            console.warn(`Hit ${targets.join(", ")}`);
            return false;
        },
    },
} as const;
