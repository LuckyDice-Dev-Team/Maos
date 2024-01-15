import { Player, world } from "@minecraft/server";
import { getInventoryComponent, isPlayer } from "../utils/entityUtils";
import { getJob } from "../api/jobApi";
import { jobs } from "../data/jobData";

world.beforeEvents.dataDrivenEntityTriggerEvent.subscribe(({ entity, id }) => {
    if (!isPlayer(entity)) {
        return;
    }

    let input;
    if (id.startsWith("lkd:keyboard")) {
        input = Number(id.substring(12));
        console.warn("keyboard", input);
    } else if (id.startsWith("lkd:mouse")) {
        input = Number(id.substring(9));
        onMouse(entity, input);
    } else if (id.startsWith("lkd:wheel")) {
        input = Number(id.substring(9));
        console.warn("wheel", input);
    }
});

const onMouse = (player: Player, input: number) => {
    const jobType = getJob(player);
    if (!jobType) {
        return;
    }

    const inventoryComponent = getInventoryComponent(player);
    const currentItem = inventoryComponent.container.getItem(player.selectedSlot);
    if (!currentItem?.getTags().includes("skill")) {
        return;
    }

    const job = jobs[jobType];
    switch (input) {
        case 1: {
            job.useSkill(player, "left");
            break;
        }

        default:
            return;
    }
};
