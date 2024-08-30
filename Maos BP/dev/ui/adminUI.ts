import UI from "./ui";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import PlayerSelectUI from "./playerSelectUI";
import { setJob, setTeam } from "../api/jobApi";
import JobSelectUI from "./jobSelectUI";
import TeamSelectUI from "./teamSelectUI";
import PropertySelectUI from "./propertySelectUI";
import InputUI from "./inputUI";
import { damage } from "../api/damageApi";
import { system } from "@minecraft/server";
import { applyDebuff } from "../api/buffApi";

export default class AdminUI extends UI {
    createForm() {
        return new ActionFormData()
            .button("팀 설정")
            .button("직업 설정")
            .button("데미지 1 부여")
            .button("1초 후 스턴 1초 부여")
            .button("프로퍼티 보기")
            .button("프로퍼티 설정")
            .button("초기화");
    }

    async processResult(result: ActionFormResponse) {
        switch (result.selection) {
            case 0: {
                await this.setTeam();
                break;
            }

            case 1: {
                await this.setJob();
                break;
            }

            case 2: {
                await this.applyDamage();
                break;
            }

            case 3: {
                await this.applyStun();
                break;
            }

            case 4: {
                await this.showProperties();
                break;
            }

            case 5: {
                await this.setProperties();
                break;
            }

            case 6: {
                await this.reset();
                break;
            }

            default:
                throw new Error("Not Implemented");
        }
    }

    private async setTeam() {
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
    }

    private async setJob() {
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
    }

    private async applyDamage() {
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
            damage(1, player, player);
        }
    }

    private async applyStun() {
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

            system.runTimeout(() => {
                if (player.isValid()) {
                    applyDebuff(player, "stun", 20);
                }
            }, 20);
        }
    }

    private async showProperties() {
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
    }

    private async setProperties() {
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
    }

    private async reset() {
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
            player.clearDynamicProperties();
        }
    }
}
