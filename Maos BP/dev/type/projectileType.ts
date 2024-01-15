import { Entity, Vector3 } from "@minecraft/server";

export type ProjectileType = "ice_magician:1";

export interface ProjectileData {
    key: ProjectileType;
    offset: Vector3;
    moveDisPerLoop: number;
    life: number;
    entityPenetrateRemain: number;
    blockPenetrateRemain: Record<string, number>;
}

export interface ProjectileFunction {
    onTick: (projectile: Projectile) => boolean;
    checkHit: (projectile: Projectile, endLocation: Vector3) => Entity[];
    onHit: (projectile: Projectile, targets: Entity[]) => boolean;
}

export interface Projectile extends ProjectileData {
    summoner: string;
    dimensionId: string;
    location: Vector3;
    vector: Vector3;
    penetratingEntities: string[];
    penetratingBlock: string | null;
    penetratingBlockLocation: Vector3 | null;
}
