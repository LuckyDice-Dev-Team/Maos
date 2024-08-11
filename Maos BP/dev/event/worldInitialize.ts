import { DimensionTypes, world } from "@minecraft/server";
import { initPlayer } from "../api/initApi";

world.afterEvents.worldInitialize.subscribe(() => {
    DimensionTypes.getAll().forEach((dimension) => {
        world
            .getDimension(dimension.typeId)
            .getPlayers()
            .forEach((player) => {
                console.warn(player.name);
                initPlayer(player.id);
            });
    });
});
