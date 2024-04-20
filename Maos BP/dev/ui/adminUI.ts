import UI from "./ui";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import PlayerSelectUI from "./playerSelectUI";
import { setJob, setTeam } from "../api/jobApi";
import JobSelectUI from "./jobSelectUI";
import TeamSelectUI from "./teamSelectUI";
import PropertySelectUI from "./propertySelectUI";
import InputUI from "./inputUI";
import { damage } from "../api/damageApi";

export default class AdminUI extends UI {
    createForm() {
        return new ActionFormData()
            .button("팀 설정")
            .button("직업 설정")
            .button("데미지 1 부여")
            .button("프로퍼티 보기")
            .button("프로퍼티 설정")
            .button("초기화");
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

            case 2: {
                const playerSelectUI = new PlayerSelectUI(this.player, true, false, {
                    maxCount: Infinity,
                    exceptSelf: false,
                });

                await playerSelectUI.show(this);
                if (playerSelectUI.getCanceled()) {
                    return;
                }

                const { selectedList, playerMap } = playerSelectUI;
                for (const playerName of selectedList) {
                    const player = playerMap.getOrThrow(playerName);
                    damage(player.id, player.id, 1);
                }

                break;
            }

            case 3: {
                const playerSelectUI = new PlayerSelectUI(this.player, true, false, {
                    maxCount: Infinity,
                    exceptSelf: false,
                });

                await playerSelectUI.show(this);
                if (playerSelectUI.getCanceled()) {
                    return;
                }

                const { selectedList, playerMap } = playerSelectUI;
                const players = selectedList.map((playerName) => playerMap.getOrThrow(playerName));

                const propertySelectUI = new PropertySelectUI(this.player, true, false, players, Infinity);
                await propertySelectUI.show(this);
                if (propertySelectUI.getCanceled()) {
                    return;
                }

                const { propertyIds } = propertySelectUI;
                const resultMap: Record<string, Record<string, string>> = {};
                players.forEach((player) => {
                    const playerMap: Record<string, string> = {};
                    propertyIds.forEach((propertyId) => {
                        playerMap[propertyId] = String(player.getDynamicProperty(propertyId));
                    });

                    resultMap[player.name] = playerMap;
                });

                this.player.sendMessage(JSON.stringify(resultMap, null, 2));
                break;
            }

            case 4: {
                const playerSelectUI = new PlayerSelectUI(this.player, true, false, {
                    maxCount: 1,
                    exceptSelf: false,
                });

                await playerSelectUI.show(this);
                if (playerSelectUI.getCanceled()) {
                    return;
                }

                const player = playerSelectUI.playerMap.getOrThrow(playerSelectUI.selectedList[0]);
                const propertySelectUI = new PropertySelectUI(this.player, true, false, [player]);
                await propertySelectUI.show(this);
                if (propertySelectUI.getCanceled()) {
                    return;
                }

                const inputUI = new InputUI(this.player, true, false);
                await inputUI.show(this);
                if (inputUI.getCanceled()) {
                    return;
                }

                player.setDynamicProperty(propertySelectUI.propertyIds[0], inputUI.input);
                break;
            }

            case 5: {
                const playerSelectUI = new PlayerSelectUI(this.player, true, false, {
                    maxCount: Infinity,
                    exceptSelf: false,
                });

                await playerSelectUI.show(this);
                if (playerSelectUI.getCanceled()) {
                    return;
                }

                const { selectedList, playerMap } = playerSelectUI;
                for (const selectedName of selectedList) {
                    const player = playerMap.getOrThrow(selectedName);
                    for (const dynamicPropertyId of player.getDynamicPropertyIds()) {
                        player.setDynamicProperty(dynamicPropertyId, undefined);
                    }
                }

                break;
            }

            default:
                throw new Error("Not Implemented");
        }
    }
}
