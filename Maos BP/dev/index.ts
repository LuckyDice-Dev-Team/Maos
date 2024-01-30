import "./tick/projectileTick";
import "./tick/statTick";
import "./event/keyboard";
import "./event/playerUseItem";
import { system } from "@minecraft/server";

system.beforeEvents.watchdogTerminate.subscribe((event) => {
    event.cancel = true;
    console.error(event.terminateReason);
});
