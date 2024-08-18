import { world } from "@minecraft/server";
import { getInventoryComponent, isPlayer } from "../utils/entityUtils";
import { getJobType } from "../api/jobApi";
import { jobs } from "../data/jobData";

world.afterEvents.dataDrivenEntityTrigger.subscribe(({ entity, eventId }) => {
    if (!isPlayer(entity)) {
        return;
    }

    const jobType = getJobType(entity);
    if (!jobType) {
        return;
    }

    const inventoryComponent = getInventoryComponent(entity);
    const currentItem = inventoryComponent.container?.getItem(entity.selectedSlotIndex);
    if (!currentItem?.typeId.startsWith("maos:job_")) {
        return;
    }

    let input;
    const job = jobs[jobType];
    if (eventId.startsWith("lkd:keyboard")) {
        input = Number(eventId.substring(12));
        switch (input) {
            case 0: {
                job.useSkill(entity, "key1");
                break;
            }

            case 1: {
                job.useSkill(entity, "key2");
                break;
            }

            case 2: {
                job.useSkill(entity, "key3");
                break;
            }

            case 3: {
                job.useSkill(entity, "key4");
                break;
            }

            default:
                return;
        }
    } else if (eventId.startsWith("lkd:mouse")) {
        input = Number(eventId.substring(9));
        switch (input) {
            case 1: {
                job.useSkill(entity, "left");
                break;
            }

            case 2: {
                job.useSkill(entity, "right");
                break;
            }

            default:
                return;
        }
    } else if (eventId.startsWith("lkd:wheel")) {
        // input = Number(eventId.substring(9));
        // TODO
    }
});
