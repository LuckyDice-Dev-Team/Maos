import UI from "./ui";
import { jobDataValues, JobType } from "../data/jobData";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { keys } from "../utils/objectUtils";
import { Entity, Player } from "@minecraft/server";
import OptionalMap from "../object/optionalMap";

export default class PropertySelectUI extends UI {
    public propertyIds: string[] = [];
    private propertyMap = new OptionalMap<number, string>();
    private readonly maxCount: number;
    private readonly selectablePropertyIds = new Set<string>();

    constructor(player: Player, retryOnBusy = true, retryOnCancel = false, players: Player[], maxCount = 1) {
        super(player, retryOnBusy, retryOnCancel);
        this.maxCount = maxCount;

        players.flatMap((player) => player.getDynamicPropertyIds())
            .forEach((propertyId) => this.selectablePropertyIds.add(propertyId));
    }

    createForm() {
        const form = new ActionFormData().title("프로퍼티 선택").button("선택 완료");
        this.propertyMap.clear();

        let index = 1;
        for (const propertyId of this.selectablePropertyIds) {
            if (this.propertyIds?.includes(propertyId)) {
                continue;
            }

            this.propertyMap.set(index++, propertyId);
            form.button(propertyId);
        }

        return form;
    }

    async processResult({ selection }: ActionFormResponse) {
        if (typeof selection === "number") {
            if (selection === 0) {
                return;
            }

            this.propertyIds.push(this.propertyMap.getOrThrow(selection));
        }

        const selectedCount = this.propertyIds.length;
        if (this.maxCount > selectedCount && this.selectablePropertyIds.size > selectedCount) {
            await this.show();
        }
    }
}
