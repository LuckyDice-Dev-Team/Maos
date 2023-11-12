import { world } from "@minecraft/server";
import { spawnProjectile } from "../api/projectileApi";
import { getProjectileData } from "../data/projectileData";

world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const blockPenetrateRemain = new Map<string, number>();
    blockPenetrateRemain.set("minecraft:glass", 1);

    spawnProjectile(event.player, getProjectileData("ice_magician", 1));
});
