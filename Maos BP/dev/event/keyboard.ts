import { Player, world } from "@minecraft/server";
import { getInventoryComponent, isPlayer } from "../utils/entityUtils";
import { getJobType } from "../api/jobApi";
import { jobs, JobType } from "../data/jobData";
import Job from "../type/jobType";

world.beforeEvents.dataDrivenEntityTriggerEvent.subscribe(({ entity, id }) => {
    if (!isPlayer(entity)) {
        return;
    }

    const jobType = getJobType(entity);
    if (!jobType) {
        return;
    }

    const inventoryComponent = getInventoryComponent(entity);
    const currentItem = inventoryComponent.container?.getItem(entity.selectedSlot);
    if (!currentItem?.getTags().includes("skill")) {
        return;
    }

    let input;
    const job = jobs[jobType];
    if (id.startsWith("lkd:keyboard")) {
        input = Number(id.substring(12));
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
    } else if (id.startsWith("lkd:mouse")) {
        input = Number(id.substring(9));
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
    } else if (id.startsWith("lkd:wheel")) {
        input = Number(id.substring(9));
        console.warn("wheel", input);
    }
});
