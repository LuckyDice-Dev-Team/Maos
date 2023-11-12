import { Player } from "@minecraft/server";
import { Projectile, ProjectileData } from "../type/projectileType";
import { calcVectors } from "../utils/mathUtils";
import { getProperty, setProperty } from "../system";

export const spawnProjectile = (player: Player, projectileData: ProjectileData) => {
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
        dimensionId: player.dimension.id,
        location: calcVectors(player.getHeadLocation(), projectileData.offset, (value1, value2) => value1 + value2),
        vector: normalizedVector,
        penetratingEntities: [],
        penetratingBlock: null,
        penetratingBlockLocation: null,
    };

    const projectiles: Projectile[] = getProperty("projectile") ?? [];
    projectiles.push(projectile);

    setProperty("projectile", JSON.stringify(projectiles));
};
