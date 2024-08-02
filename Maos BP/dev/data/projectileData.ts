import { CheckHitOption, Projectile, ProjectileData, ProjectileFunction, ProjectileType } from "../type/projectileType";
import { JobType } from "./jobData";
import { dimensions, overworld } from "../system";
import { Vector3, world } from "@minecraft/server";
import { calcVectorLength, calcVectors } from "../utils/mathUtils";
import OptionalMap from "../object/optionalMap";
import { TeamTag } from "./tag";
import { damageById } from "../api/damageApi";
import { setDebuff } from "../api/buffApi";
import { debuffPropertyValues } from "./propertyData";
import { getCenter } from "../utils/entityUtils";
import { Space } from "../space/space";

const projectileDatas: Record<JobType, Record<number, ProjectileData>> = {
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
            blockPenetrateRemain: {},
            maxHitPerOnce: 1,
        },
        2: {
            key: "ice_magician:2",
            offset: {
                x: 0,
                y: 0.125,
                z: 0,
            },
            moveDisPerLoop: 1.1,
            life: 15,
            entityPenetrateRemain: 0,
            blockPenetrateRemain: {},
            maxHitPerOnce: 1,
        },
    },
    archer: {},
};

export const getProjectileData = (jobType: JobType, key: number) => {
    const projectileData = projectileDatas[jobType][key];
    if (!projectileData) {
        throw new Error(`Unknown key - ${jobType} ${key}`);
    }

    return projectileData;
};

const getDefaultCheckHit = ({ includeAlly, includeEnemy, includeSelf, radius }: CheckHitOption) => {
    return function ({ location: startLocation, team, summoner }: Projectile, endLocation: Vector3, targetHitLocations: Record<string, Vector3>) {
        const hitEntities: string[] = [];
        const distanceMap = new OptionalMap<string, number>();

        const lineVector = calcVectors(startLocation, endLocation, (x, y) => y - x);
        const totalDistance = calcVectorLength(lineVector);
        const normalizedLineVector = Space.divide(lineVector, totalDistance);

        const midLocation = calcVectors(startLocation, endLocation, (v1, v2) => (v2 + v1) / 2);
        const excludeTags: TeamTag[] = [];

        if (!includeAlly) {
            excludeTags.push(team);
        }

        if (!includeEnemy) {
            excludeTags.push(team === "blue" ? "red" : "blue");
        }

        const possibleEntities = overworld.getEntities({
            excludeTags,
            location: midLocation,
            maxDistance: totalDistance / 2 + radius + 1,
        });

        if (!possibleEntities.length) {
            return [];
        }

        for (const entity of possibleEntities) {
            if (!includeSelf && entity.id === summoner) {
                continue;
            }

            const entityLocation = { ...entity.location };
            const yDiff = entity.getHeadLocation().y - entityLocation.y;
            entityLocation.y += yDiff * 0.6;

            const crossVector = Space.cross(
                calcVectors(entityLocation, startLocation, (v1, v2) => v1 - v2),
                normalizedLineVector,
            );

            const distanceToLine = calcVectorLength(crossVector) / calcVectorLength(normalizedLineVector);
            if (distanceToLine <= radius) {
                distanceMap.set(entity.id, Space.distance(entityLocation, startLocation));
                hitEntities.push(entity.id);

                const targetHitLocation = calcVectors(startLocation, normalizedLineVector, (value1, value2) => value1 + value2 * radius);
                const offsetPercent = calcVectorLength(calcVectors(targetHitLocation, entityLocation, (v1, v2) => v1 - v2)) / radius;
                targetHitLocations[entity.id] = calcVectors(
                    startLocation,
                    normalizedLineVector,
                    (value1, value2) => value1 + value2 * radius * 1.5 * offsetPercent,
                );
            }
        }

        return hitEntities.sort((a, b) => distanceMap.getOrThrow(a) - distanceMap.getOrThrow(b));
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
            radius: 1.15,
            includeSelf: false,
            includeAlly: false,
            includeEnemy: true,
        }),
        onHit: ({ summoner, dimensionId }, [target], targetHitLocations) => {
            damageById(80, summoner, target);
            dimensions[dimensionId].spawnParticle("maos:common_hit", targetHitLocations[target]);

            return true;
        },
    },
    "ice_magician:2": {
        onTick: () => {
            return false;
        },
        onPath: ({ dimensionId }, locations) => {
            const dimension = dimensions[dimensionId];
            locations.forEach((location) => {
                dimension.spawnParticle("maos:ice_magician_2_tick1", location);
                dimension.spawnParticle("maos:ice_magician_2_tick2", location);
            });
        },
        checkHit: getDefaultCheckHit({
            radius: 1.0,
            includeSelf: false,
            includeAlly: false,
            includeEnemy: true,
        }),
        onHit: ({ summoner, dimensionId }, [target], targetHitLocations) => {
            damageById(100, summoner, target);

            const entity = world.getEntity(target);
            if (entity) {
                setDebuff(entity, debuffPropertyValues.pin, 30); // 파티클 시간과 연계

                const dimension = dimensions[dimensionId];
                dimension.spawnParticle("maos:common_hit", targetHitLocations[target]);
                dimension.spawnParticle("maos:ice_magician_2_hit", getCenter(entity));
            }

            return true;
        },
    },
} as const;
