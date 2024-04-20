import { Entity } from "@minecraft/server";
import { isPlayer } from "./entityUtils";

export type InputPermission = "free" | "pin" | "stun";

export const setInputPermission = (entity: Entity, permission: InputPermission) => {
    const playerYn = isPlayer(entity);

    switch (permission) {
        case "free": {
            if (playerYn) {
                entity.runCommand("inputpermission set @s camera enabled");
                entity.runCommand("inputpermission set @s movement enabled");
            } else {
                entity.runCommand("effect @s slowness 0");
            }

            break;
        }

        case "pin": {
            if (playerYn) {
                entity.runCommand("inputpermission set @s camera enabled");
                entity.runCommand("inputpermission set @s movement disabled");
            } else {
                entity.runCommand("effect @s slowness 9999999 255 true");
            }

            break;
        }

        case "stun": {
            if (playerYn) {
                entity.runCommand("inputpermission set @s camera disabled");
                entity.runCommand("inputpermission set @s movement disabled");
            } else {
                entity.runCommand("effect @s slowness 9999999 255 true");
            }

            break;
        }
    }
};
