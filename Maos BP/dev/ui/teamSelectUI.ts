import UI from "./ui";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { TeamTag, teamTagValues } from "../data/tag";
import { keys } from "../utils/objectUtils";

export default class TeamSelectUI extends UI {
    public teamTag?: TeamTag;
    private teamTagMap = new Map<number, TeamTag>();

    createForm() {
        const form = new ActionFormData().title("팀 선택");
        const teamTags = keys(teamTagValues);

        this.teamTagMap.clear();
        for (let i = 0; i < teamTags.length; i++) {
            const teamTag = teamTags[i];

            this.teamTagMap.set(i, teamTag);
            form.button(teamTag);
        }

        return form;
    }

    processResult({ selection }: ActionFormResponse) {
        if (typeof selection === "number") {
            this.teamTag = this.teamTagMap.get(selection);
        }
    }
}
