import { Block, Dimension, LocationInUnloadedChunkError, LocationOutOfWorldBoundariesError, Vector3 } from "@minecraft/server";
import { getDiffVector, getHitLocations } from "../utils/projectileUtils";
import { dimensions, getSystemProperty, registerEvent, setSystemProperty } from "../system";
import { Projectile, ProjectileFunction } from "../type/projectileType";
import { projectileFunctions } from "../data/projectileData";
import { Space } from "../space/space";

interface BlockHitData {
    hitLocation: Vector3;
    typeId: string;
    penetrateKey: string;
    penetrateVector: Vector3;
}

const createCacheKey = (vector: Vector3, doFloor = true) => {
    if (doFloor) {
        return `${Math.floor(vector.x)}_${Math.floor(vector.y)}_${Math.floor(vector.z)}`;
    }

    return `${vector.x}_${vector.y}_${vector.z}`;
};

const getBlockWithCache = (dimension: Dimension, location: Vector3, blockCache: Map<string, Block | undefined>) => {
    const cacheKey = createCacheKey(location);

    let block = blockCache.get(cacheKey);
    if (!block) {
        block = dimension.getBlock(location);
        blockCache.set(cacheKey, block);
    }

    return block;
};

const filterTargets = (projectile: Projectile, targets: ReturnType<ProjectileFunction["checkHit"]>) => {
    const penetratingEntities = new Set(projectile.penetratingEntities);
    const newPenetratingEntities: string[] = [];

    if (!penetratingEntities.size) {
        targets.splice(projectile.maxHitPerOnce);
        projectile.penetratingEntities = targets.map((target) => target.entityId);

        return targets.length > 0;
    }

    let size = targets.length;
    for (let i = 0; i < size; i++) {
        const targetId = targets[i].entityId;
        newPenetratingEntities.push(targetId);

        if (penetratingEntities.has(targetId)) {
            targets.splice(i--, 1);
            size--;
        }
    }

    targets.splice(projectile.maxHitPerOnce);
    projectile.penetratingEntities = newPenetratingEntities;

    return targets.length > 0;
};

registerEvent(() => {
    const deadProjectiles: Projectile[] = [];
    const blockCache = new Map<string, Block | undefined>();
    const projectiles: Projectile[] = getSystemProperty("projectile") ?? [];

    const start = Date.now();
    for (const projectile of projectiles) {
        try {
            if (--projectile.life === 0) {
                deadProjectiles.push(projectile);
                continue;
            }

            const { key, dimensionId, vector, moveDisPerLoop, blockPenetrateRemain } = projectile;
            const { onTick, onPath, checkHit, onHit } = projectileFunctions[key];
            let { location, penetratingBlock, penetratingBlockLocation } = projectile;

            if (onTick(projectile)) {
                deadProjectiles.push(projectile);
                continue;
            }

            let paths: Vector3[] = [];
            const nextLocation = Space.add(location, Space.multiply(vector, moveDisPerLoop));
            const hitLocations = getHitLocations(location, nextLocation, paths);

            const isXPositive = vector.x >= 0;
            const isYPositive = vector.y >= 0;
            const isZPositive = vector.z >= 0;

            const dimension = dimensions[dimensionId];
            let penetrating = false;
            let blockHitData: BlockHitData | null = null;

            for (const hitLocation of hitLocations) {
                const block = getBlockWithCache(dimension, hitLocation, blockCache);
                if (!block) {
                    console.error("Block is undefined", hitLocation.x, hitLocation.y, hitLocation.z);
                    break;
                }

                const typeId = block.typeId;
                const keyVector = {
                    x: Math.floor(block.x),
                    y: Math.floor(block.y),
                    z: Math.floor(block.z),
                };

                const blockCacheKey = createCacheKey(keyVector, false);
                const keySuffix = `_${typeId}`;
                const penetrateKey = `${blockCacheKey}${keySuffix}`;

                if (penetratingBlock === penetrateKey) {
                    penetrating = true;
                    continue;
                } else if (penetratingBlockLocation && penetratingBlock?.endsWith(keySuffix)) {
                    const totalDiff = Space.sum(getDiffVector(penetratingBlockLocation, keyVector));
                    if (totalDiff === 1) {
                        penetrating = true;
                        penetratingBlock = penetrateKey;
                        penetratingBlockLocation = keyVector;

                        continue;
                    }
                }

                // 이게 문제인데, 어떻게 수정할지 고민해야 한다 (BE는 solid 판정이 좀 이상함). 기존처럼 통과 가능한 블록 목록을 수동으로 작성하는 방법을 고려중
                if (!block.isAir && !block.isLiquid) {
                    blockHitData = {
                        typeId,
                        penetrateKey,
                        penetrateVector: keyVector,
                        hitLocation: {
                            x: hitLocation.x,
                            y: hitLocation.y,
                            z: hitLocation.z,
                        },
                    };
                }
            }

            if (!penetrating) {
                penetratingBlock = null;
                penetratingBlockLocation = null;
            }

            location = nextLocation;

            // 블록 히트 검사
            if (blockHitData) {
                const { hitLocation, typeId, penetrateKey, penetrateVector } = blockHitData;
                if (
                    location.x >= hitLocation.x === isXPositive &&
                    location.y >= hitLocation.y === isYPositive &&
                    location.z >= hitLocation.z === isZPositive
                ) {
                    const penetrateRemain = blockPenetrateRemain[typeId] ?? blockPenetrateRemain["any"];
                    if (!penetrateRemain) {
                        deadProjectiles.push(projectile);

                        if (onPath) {
                            paths = paths.filter(
                                (path) =>
                                    path.x >= hitLocation.x === isXPositive &&
                                    path.y >= hitLocation.y === isYPositive &&
                                    path.z >= hitLocation.z === isZPositive,
                            );
                            onPath(projectile, paths, hitLocation);
                        }

                        break;
                    }

                    blockPenetrateRemain[blockPenetrateRemain[typeId] ? typeId : "any"] = penetrateRemain - 1;
                    penetratingBlock = penetrateKey;
                    penetratingBlockLocation = penetrateVector;
                }
            }

            projectile.penetratingBlock = penetratingBlock;
            projectile.penetratingBlockLocation = penetratingBlockLocation;
            onPath?.(projectile, paths, undefined);

            const targetHitLocations: Record<string, Vector3> = {};
            const targets = checkHit(projectile, location, targetHitLocations);
            if (targets.length) {
                if (filterTargets(projectile, targets)) {
                    const deadByHitEvent = onHit(projectile, targets, targetHitLocations);

                    projectile.entityPenetrateRemain -= targets.length;
                    const deadByPenetrateLimit = projectile.entityPenetrateRemain < 0;

                    if (deadByHitEvent || deadByPenetrateLimit) {
                        deadProjectiles.push(projectile);
                        break;
                    }
                }
            } else {
                projectile.penetratingEntities = [];
            }

            projectile.location = location;
        } catch (e) {
            if (!(e instanceof LocationOutOfWorldBoundariesError || e instanceof LocationInUnloadedChunkError)) {
                console.error("Projectile Interval", e, JSON.stringify(projectiles));
            }

            deadProjectiles.push(projectile);
        }
    }

    for (const deadProjectile of deadProjectiles) {
        const index = projectiles.indexOf(deadProjectile);
        if (index === -1) {
            console.warn("Failed to find index", JSON.stringify(projectiles), JSON.stringify(deadProjectiles), JSON.stringify(deadProjectile));
        }

        projectiles.splice(index, 1);
    }

    setSystemProperty("projectile", JSON.stringify(projectiles));

    const took = Date.now() - start;
    if (took > 5) {
        console.warn(`Took ${Date.now() - start}ms in projectileTick`);
    }
});
