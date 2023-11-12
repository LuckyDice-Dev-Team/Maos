import { world } from "@minecraft/server";
import { isPlayer } from "../utils/entityUtils";

world.beforeEvents.dataDrivenEntityTriggerEvent.subscribe(({ entity, id }) => {
    if (!isPlayer(entity) || !id.startsWith("lkd:keyboard")) {
        return;
    }

    const skillNumber = Number(id.substring(12));
    console.warn(skillNumber);
});
