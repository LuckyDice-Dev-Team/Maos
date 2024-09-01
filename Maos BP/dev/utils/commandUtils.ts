import { Entity } from "@minecraft/server";
import { isPlayer } from "./entityUtils";
import { valuedDebuffActionMap } from "../api/buffApi";

export type InputPermission = "free" | "pin" | "stun";

export const setInputPermission = (entity: Entity, permission: InputPermission) => {
    const playerYn = isPlayer(entity);

    switch (permission) {
        case "free": {
            if (playerYn) {
                entity.runCommand("inputpermission set @s camera enabled");
                entity.runCommand("inputpermission set @s movement enabled");
            } else {
                entity.removeEffect("slowness");
            }

            break;
        }

        case "pin": {
            if (playerYn) {
                entity.teleport(entity.location);
                entity.runCommand("inputpermission set @s camera enabled");
                entity.runCommand("inputpermission set @s movement disabled");
            } else {
                entity.clearVelocity();
                entity.addEffect("slowness", 20_000_000, { amplifier: 255, showParticles: false });
            }

            break;
        }

        case "stun": {
            if (playerYn) {
                entity.teleport(entity.location);
                entity.runCommand("inputpermission set @s camera disabled");
                entity.runCommand("inputpermission set @s movement disabled");
            } else {
                entity.clearVelocity();
                entity.addEffect("slowness", 20_000_000, { amplifier: 255, showParticles: false });
            }

            break;
        }
    }

    valuedDebuffActionMap.getOrThrow("slow")(entity);
};
