import { Entity, Player } from "@minecraft/server";

export const isPlayer = (entity: Entity): entity is Player => {
    return entity instanceof Player;
};
