import {
    Block,
    Dimension,
    Entity,
    LocationInUnloadedChunkError,
    LocationOutOfWorldBoundariesError,
    Player,
    system,
    Vector3,
    world,
} from "@minecraft/server";
import { calcVectors, floorVector, sumVector } from "./utils/mathUtils";
import { getDiffVector, getHitLocations } from "./utils/projectileUtils";

interface ProjectileData {
    offset: Vector3;
    moveDisPerLoop: number;
    life: number;
    entityPenetrateRemain: number;
    blockPenetrateRemain: Map<string, number>;
    onTick: (projectile: Projectile) => boolean;
    checkHit: (projectile: Projectile, endLocation: Vector3) => Entity[];
    onHit: (projectile: Projectile, targets: Entity[]) => boolean;
}

interface Projectile extends ProjectileData {
    summoner: string;
    dimension: Dimension;
    location: Vector3;
    vector: Vector3;
    penetratingEntities: Set<string>;
    penetratingBlock: string | null;
    penetratingBlockLocation: Vector3 | null;
}

interface BlockHitData {
    hitLocation: Vector3;
    typeId: string;
    penetrateKey: string;
    penetrateVector: Vector3;
}

const projectiles: Set<Projectile> = new Set();

const spawnProjectile = (player: Player, projectileData: ProjectileData) => {
    const viewVector = player.getViewDirection();
    const { x, y, z } = viewVector;

    const distance = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    const normalizedVector = {
        x: x / distance,
        y: y / distance,
        z: z / distance,
    };

    const projectile: Projectile = {
        ...projectileData,
        summoner: player.id,
        dimension: player.dimension,
        location: calcVectors(player.getHeadLocation(), projectileData.offset, (value1, value2) => value1 + value2),
        vector: normalizedVector,
        penetratingEntities: new Set(),
        penetratingBlock: null,
        penetratingBlockLocation: null,
    };

    projectiles.add(projectile);
};

world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const blockPenetrateRemain = new Map<string, number>();
    blockPenetrateRemain.set("minecraft:glass", 1);

    spawnProjectile(event.player, {
        blockPenetrateRemain,
        offset: {
            x: 0,
            y: 0.125,
            z: 0,
        },
        moveDisPerLoop: 1.5,
        life: 20,
        entityPenetrateRemain: 0,
        onTick: ({ dimension, location }) => {
            dimension.spawnParticle("maos:ice_magician_1_tick1", location);
            dimension.spawnParticle("maos:ice_magician_1_tick2", location);
            dimension.spawnParticle("maos:ice_magician_1_tick3", location);

            return false;
        },
        checkHit: () => [],
        onHit: () => false,
    });
});

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

system.runInterval(() => {
    const deadProjectiles: Projectile[] = [];
    const blockCache = new Map<string, Block | undefined>();

    const start = Date.now();
    for (const projectile of projectiles) {
        try {
            if (--projectile.life === 0) {
                deadProjectiles.push(projectile);
                continue;
            }

            const { dimension, vector, moveDisPerLoop, blockPenetrateRemain, onTick, checkHit, onHit } = projectile;
            let { location, penetratingBlock, penetratingBlockLocation } = projectile;

            if (onTick(projectile)) {
                deadProjectiles.push(projectile);
                continue;
            }

            const hitLocations = getHitLocations(
                location,
                calcVectors(location, vector, (value1, value2) => value1 + value2 * moveDisPerLoop),
            );

            const isXPositive = vector.x >= 0;
            const isYPositive = vector.y >= 0;
            const isZPositive = vector.z >= 0;

            let penetrating = false;
            let blockHitData: BlockHitData | null = null;

            for (const hitLocation of hitLocations) {
                const block = getBlockWithCache(dimension, hitLocation, blockCache);
                if (!block) {
                    console.error("Block is undefined", hitLocation.x, hitLocation.y, hitLocation.z);
                    break;
                }

                const typeId = block.typeId;
                const keyVector = floorVector({
                    x: block.x,
                    y: block.y,
                    z: block.z,
                });

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

            location = calcVectors(location, vector, (value1, value2) => value1 + value2 * moveDisPerLoop);

            // 블록 히트 검사
            if (blockHitData) {
                const { hitLocation, typeId, penetrateKey, penetrateVector } = blockHitData;
                if (
                    location.x >= hitLocation.x === isXPositive &&
                    location.y >= hitLocation.y === isYPositive &&
                    location.z >= hitLocation.z === isZPositive
                ) {
                    const penetrateRemain = blockPenetrateRemain.get(typeId);
                    if (!penetrateRemain) {
                        deadProjectiles.push(projectile);
                        break;
                    }

                    blockPenetrateRemain.set(typeId, penetrateRemain - 1);
                    penetratingBlock = penetrateKey;
                    penetratingBlockLocation = penetrateVector;
                }
            }

            projectile.penetratingBlock = penetratingBlock;
            projectile.penetratingBlockLocation = penetratingBlockLocation;

            const targets = checkHit(projectile, location);
            if (targets.length) {
                if (onHit(projectile, targets)) {
                    deadProjectiles.push(projectile);
                    break;
                }
            } else {
                projectile.penetratingEntities.clear();
            }

            projectile.location = location;
        } catch (e) {
            if (!(e instanceof LocationOutOfWorldBoundariesError || e instanceof LocationInUnloadedChunkError)) {
                console.error("Projectile Interval", e);
            }

            deadProjectiles.push(projectile);
        }
    }

    for (const deadProjectile of deadProjectiles) {
        projectiles.delete(deadProjectile);
    }

    const took = Date.now() - start;
    if (took > 1) {
        console.warn(`Took ${Date.now() - start}ms`);
    }
});
