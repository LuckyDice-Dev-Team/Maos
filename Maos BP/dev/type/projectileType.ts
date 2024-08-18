import { Vector3 } from "@minecraft/server";
import { TeamTag } from "../data/tag";

export type ProjectileType = "ice_magician:1" | "ice_magician:2";

export interface ProjectileData {
    key: ProjectileType;
    offset: Vector3;
    moveDisPerLoop: number;
    life: number;
    entityPenetrateRemain: number;
    blockPenetrateRemain: Record<string, number>;
    maxHitPerOnce: number;
}

export interface ProjectileFunction {
    onTick: (projectile: Projectile) => boolean;
    onPath?: (projectile: Projectile, locations: Vector3[], deadLocation?: Vector3) => void;
    checkHit: (
        projectile: Projectile,
        endLocation: Vector3,
        targetHitLocations: Record<string, Vector3>,
    ) => {
        entityId: string;
        distance: number;
        hitLocation: Vector3;
    }[];
    onHit: (projectile: Projectile, targets: ReturnType<ProjectileFunction["checkHit"]>, targetHitLocations: Record<string, Vector3>) => boolean;
}

export interface Projectile extends ProjectileData {
    summoner: string;
    team: TeamTag;
    dimensionId: string;
    location: Vector3;
    vector: Vector3;
    penetratingEntities: string[];
    penetratingBlock: string | null;
    penetratingBlockLocation: Vector3 | null;
}

export interface CheckHitOption {
    radius: number;
    includeSelf: boolean;
    includeAlly: boolean;
    includeEnemy: boolean;
}
