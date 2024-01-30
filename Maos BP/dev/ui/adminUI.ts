import UI from "./ui";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import PlayerSelectUI from "./playerSelectUI";
import { setJob, setTeam } from "../api/jobApi";
import JobSelectUI from "./jobSelectUI";
import TeamSelectUI from "./teamSelectUI";

export default class AdminUI extends UI {
    createForm() {
        return new ActionFormData().button("팀 설정").button("직업 설정");
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

                const teamSelectUI = new TeamSelectUI(this.player);
                await teamSelectUI.show(this);
                if (teamSelectUI.getCanceled()) {
                    return;
                }

                const { selectedList, playerMap } = playerSelectUI;
                const teamTag = teamSelectUI.teamTag;

                for (const selectedName of selectedList) {
                    const player = playerMap.getOrThrow(selectedName);
                    setTeam(player, teamTag);
                }

                break;
            }

            case 1: {
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
