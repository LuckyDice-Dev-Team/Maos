import { Player } from "@minecraft/server";
import { Projectile, ProjectileData } from "../type/projectileType";
import { getSystemProperty, setSystemProperty } from "../system";
import { getTeam } from "./jobApi";
import { TeamTag } from "../data/tag";
import { Space } from "../space/space";

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
        team: getTeam(player) as TeamTag,
        dimensionId: player.dimension.id,
        location: Space.add(player.getHeadLocation(), projectileData.offset),
        vector: normalizedVector,
        penetratingEntities: [],
        penetratingBlock: null,
        penetratingBlockLocation: null,
    };

    const projectiles: Projectile[] = getSystemProperty("projectile") ?? [];
    projectiles.push(projectile);

    setSystemProperty("projectile", JSON.stringify(projectiles));
};
