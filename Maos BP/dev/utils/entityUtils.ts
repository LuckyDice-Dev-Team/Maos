import { Entity, EntityInventoryComponent, Player, world } from "@minecraft/server";

export const isPlayer = (entity?: Entity): entity is Player => {
    return entity instanceof Player;
};

export const sendWarn = (player: Player, ...messages: unknown[]) => {
    player.sendMessage(`§e${messages.map((message) => String(message)).join(" ")}`);
};

export const getInventoryComponent = (entity: Entity) => {
    return entity.getComponent(EntityInventoryComponent.componentId) as EntityInventoryComponent;
};

export const getCenter = (entity: Entity) => {
    return {
        ...entity.location,
        y: (entity.location.y + entity.getHeadLocation().y) / 2,
    };
};
