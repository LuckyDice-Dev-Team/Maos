import UI from "./ui";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { Player } from "@minecraft/server";
import OptionalMap from "../object/optionalMap";
import InputUI from "./inputUI";

export default class PropertySelectUI extends UI {
    public propertyIds: string[] = [];
    private propertyMap = new OptionalMap<number, string>();
    private readonly maxCount: number;
    private readonly selectablePropertyIds = new Set<string>();

    constructor(player: Player, retryOnBusy = true, retryOnCancel = false, players: Player[], maxCount = 1) {
        super(player, retryOnBusy, retryOnCancel);
        this.maxCount = maxCount;

        players.flatMap((player) => player.getDynamicPropertyIds()).forEach((propertyId) => this.selectablePropertyIds.add(propertyId));
    }

    createForm() {
        const form = new ActionFormData().title("프로퍼티 선택").button("선택 완료").button("직접 입력");
        this.propertyMap.clear();

        let index = 2;
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
                if (!this.propertyIds.length) {
                    this.cancelReason = "프로퍼티가 선택되지 않았습니다";
                }

                return;
            } else if (selection === 1) {
                const inputUI = new InputUI(this.player, true, false);
                await inputUI.show(this);
                if (inputUI.getCanceled()) {
                    return;
                }

                const { input } = inputUI;
                if (!input) {
                    this.cancelReason = "프로퍼티가 선택되지 않았습니다";
                    return;
                }

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
