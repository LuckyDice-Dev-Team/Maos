import { Block, Dimension, LocationInUnloadedChunkError, LocationOutOfWorldBoundariesError, Vector3 } from "@minecraft/server";
import { calcVectors, sumVector } from "../utils/mathUtils";
import { getDiffVector, getHitLocations } from "../utils/projectileUtils";
import { dimensions, getProperty, registerEvent, setProperty } from "../system";
import { Projectile } from "../type/projectileType";
import { projectileFunctions } from "../data/projectileData";

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

const filterTargets = (projectile: Projectile, targets: string[]) => {
    const penetratingEntities = new Set(projectile.penetratingEntities);
    const newPenetratingEntities: string[] = [];

    if (!penetratingEntities.size) {
        targets.splice(projectile.maxHitPerOnce);
        projectile.penetratingEntities = [...targets];

        return targets.length > 0;
    }

    let size = targets.length;
    for (let i = 0; i < size; i++) {
        const target = targets[i];
        newPenetratingEntities.push(target);

        if (penetratingEntities.has(target)) {
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
    const projectiles: Projectile[] = getProperty("projectile") ?? [];

    const start = Date.now();
    for (const projectile of projectiles) {
        try {
            if (--projectile.life === 0) {
                deadProjectiles.push(projectile);
                continue;
            }

            const { key, dimensionId, vector, moveDisPerLoop, blockPenetrateRemain } = projectile;
            const { onTick, checkHit, onHit } = projectileFunctions[key];
            let { location, penetratingBlock, penetratingBlockLocation } = projectile;

            if (onTick(projectile)) {
                deadProjectiles.push(projectile);
                continue;
            }

            const nextLoaction = calcVectors(location, vector, (value1, value2) => value1 + value2 * moveDisPerLoop);

            const hitLocations = getHitLocations(
                location,
                nextLoaction,
            );

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
                    const totalDiff = sumVector(getDiffVector(penetratingBlockLocation, keyVector));
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

            location = nextLoaction;

            // 블록 히트 검사
            if (blockHitData) {
                const { hitLocation, typeId, penetrateKey, penetrateVector } = blockHitData;
                if (
                    location.x >= hitLocation.x === isXPositive &&
                    location.y >= hitLocation.y === isYPositive &&
                    location.z >= hitLocation.z === isZPositive
                ) {
                    const penetrateRemain = blockPenetrateRemain[typeId];
                    if (!penetrateRemain) {
                        deadProjectiles.push(projectile);
                        break;
                    }

                    blockPenetrateRemain[typeId] = penetrateRemain - 1;
                    penetratingBlock = penetrateKey;
                    penetratingBlockLocation = penetrateVector;
                }
            }

            projectile.penetratingBlock = penetratingBlock;
            projectile.penetratingBlockLocation = penetratingBlockLocation;

            const targets = checkHit(projectile, location);
            if (targets.length) {
                if (filterTargets(projectile, targets)) {
                    const deadByHitEvent = onHit(projectile, targets);

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

    setProperty("projectile", JSON.stringify(projectiles));

    const took = Date.now() - start;
    if (took > 5) {
        console.warn(`Took ${Date.now() - start}ms`);
    }
});
