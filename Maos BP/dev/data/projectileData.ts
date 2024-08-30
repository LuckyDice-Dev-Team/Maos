import { CheckHitOption, Projectile, ProjectileData, ProjectileFunction, ProjectileType } from "../type/projectileType";
import { JobType } from "./jobData";
import { dimensions, overworld } from "../system";
import { Vector3, world } from "@minecraft/server";
import { TeamTag } from "./tag";
import { damageById } from "../api/damageApi";
import { applyDebuff } from "../api/buffApi";
import { debuffPropertyValues } from "./propertyData";
import { getCenter } from "../utils/entityUtils";
import { Space } from "../space/space";
import { trySpawnParticle } from "../utils/particleUtils";
import { getPerpendicularFoot } from "../utils/mathUtils";

const projectileDatas: Record<JobType, Record<number, ProjectileData>> = {
    ice_magician: {
        1: {
            key: "ice_magician:1",
            offset: {
                x: 0,
                y: 0.125,
                z: 0,
            },
            moveDisPerLoop: 2.25,
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
            moveDisPerLoop: 1.6,
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
    return function (
        { location: startLocation, team, summoner, vector }: Projectile,
        endLocation: Vector3,
        targetHitLocations: Record<string, Vector3>,
    ) {
        const hitEntities: ReturnType<ProjectileFunction["checkHit"]> = [];

        const lineVector = Space.subtract(endLocation, startLocation);
        const totalDistance = Space.len(lineVector);
        const normalizedLineVector = Space.divide(lineVector, totalDistance);

        const midLocation = Space.divide(Space.add(startLocation, endLocation), 2);
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

            const crossVector = Space.cross(Space.subtract(entityLocation, startLocation), normalizedLineVector);
            const distanceToLine = Space.len(crossVector) / Space.len(normalizedLineVector);
            if (distanceToLine <= radius) {
                const hitLocation = getPerpendicularFoot(startLocation, endLocation, entityLocation);

                targetHitLocations[entity.id] = hitLocation;
                hitEntities.push({
                    hitLocation,
                    entityId: entity.id,
                    distance: Space.subtract(startLocation, entityLocation).len(),
                });
            }
        }

        return hitEntities.sort((a, b) => a.distance - b.distance);
    };
};

export const projectileFunctions: {
    [key in ProjectileType]: ProjectileFunction;
} = {
    "ice_magician:1": {
        onTick: ({ dimensionId, location }) => {
            const dimension = dimensions[dimensionId];
            dimension.playSound("job.ice_magician.left.tick", location);
            trySpawnParticle(dimension, "maos:ice_magician_1_tick1", location);
            trySpawnParticle(dimension, "maos:ice_magician_1_tick2", location);
            trySpawnParticle(dimension, "maos:ice_magician_1_tick3", location);

            return false;
        },
        checkHit: getDefaultCheckHit({
            radius: 1.15,
            includeSelf: false,
            includeAlly: false,
            includeEnemy: true,
        }),
        onHit: ({ summoner, dimensionId }, [{ entityId: targetId }], targetHitLocations) => {
            const dimension = dimensions[dimensionId];
            const targetHitLocation = targetHitLocations[targetId];

            dimension.playSound("job.ice_magician.left.hit", targetHitLocation);
            trySpawnParticle(dimension, "maos:common_hit", targetHitLocation);
            damageById(80, summoner, targetId);

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
                trySpawnParticle(dimension, "maos:ice_magician_2_tick1", location);
                trySpawnParticle(dimension, "maos:ice_magician_2_tick2", location);
            });
        },
        checkHit: getDefaultCheckHit({
            radius: 1.0,
            includeSelf: false,
            includeAlly: false,
            includeEnemy: true,
        }),
        onHit: ({ summoner, dimensionId }, [{ entityId: targetId }], targetHitLocations) => {
            damageById(100, summoner, targetId);

            const target = world.getEntity(targetId);
            if (target) {
                applyDebuff(target, debuffPropertyValues.pin, 30); // 파티클 시간과 연계

                const dimension = dimensions[dimensionId];
                const targetHitLocation = targetHitLocations[targetId];
                dimension.playSound("job.ice_magician.right.hit", targetHitLocation);
                trySpawnParticle(dimension, "maos:common_hit", targetHitLocation);
                trySpawnParticle(dimension, "maos:ice_magician_2_hit", getCenter(target));
            }

            return true;
        },
    },
} as const;
