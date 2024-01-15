import "./tick/projectileTick";
import "./event/keyboard";
import "./event/playerUseItem";
import { system } from "@minecraft/server";

system.beforeEvents.watchdogTerminate.subscribe((event) => {
    event.cancel = true;
    console.error(event.terminateReason);
});
