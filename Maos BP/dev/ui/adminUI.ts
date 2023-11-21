import UI from "./ui";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import PlayerSelectUI from "./playerSelectUI";
import { setJob } from "../api/jobApi";
import JobSelectUI from "./jobSelectUI";

export default class AdminUI extends UI {
    createForm() {
        return new ActionFormData().button("직업 설정");
    }

    async processResult(result: ActionFormResponse) {
        switch (result.selection) {
            case 0: {
                const playerSelectUI = new PlayerSelectUI(this.player, true, false, {
                    maxCount: Infinity,
                    exceptSelf: false,
                });

                await playerSelectUI.show(this);
                if (playerSelectUI.getCanceled()) {
                    return;
                }

                const jobSelectUI = new JobSelectUI(this.player);
                await jobSelectUI.show(this);
                if (jobSelectUI.getCanceled()) {
                    return;
                }

                const { selectedList, playerMap } = playerSelectUI;
                const jobType = jobSelectUI.jobType;

                for (const selectedName of selectedList) {
                    const player = playerMap.getOrThrow(selectedName);
                    setJob(player, jobType);
                }

                break;
            }

            default:
                throw new Error("Not Implemented");
        }
    }
}
