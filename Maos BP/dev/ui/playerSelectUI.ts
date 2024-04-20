import UI from "./ui";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { EntityQueryOptions, Player } from "@minecraft/server";
import { overworld } from "../system";
import OptionalMap from "../object/optionalMap";

interface PlayerSelectUIOption {
    queryOption: EntityQueryOptions;
    maxCount: number;
    exceptSelf: boolean;
    enableDuplicateSelect: boolean;
}

export default class PlayerSelectUI extends UI {
    /**
     * Default Options
     * <pre>
     *  queryOption: {}
     *  maxCount: 1
     *  exceptSelf: true
     *  enableDuplicateSelect: false
     * </pre>
     */
    public static readonly defaultOption: PlayerSelectUIOption = {
        queryOption: {},
        maxCount: 1,
        exceptSelf: true,
        enableDuplicateSelect: false,
    };

    public readonly selectedList: string[] = [];
    public readonly playerMap = new OptionalMap<string, Player>();

    private readonly option: PlayerSelectUIOption;
    private readonly selectCountMap = new Map<string, number>();
    private readonly nameMap = new OptionalMap<number, string>();

    constructor(player: Player, retryOnBusy = true, retryOnCancel = false, option: Partial<PlayerSelectUIOption> = {}) {
        super(player, retryOnBusy, retryOnCancel);
        this.option = {
            ...PlayerSelectUI.defaultOption,
            ...option,
        };
    }

    createForm() {
        const playerName = this.player.name;
        const form = new ActionFormData().title("플레이어 선택").button("선택 완료");
        const targets = overworld.getPlayers(this.option.queryOption).filter((target) => {
            const { name: targetName } = target;

            // 중복 선택이 활성화되있거나 선택되지 않았어야 하고 && 날 제외하는게 아니거나 내가 대상이 아니어야 함
            return (
                (this.option.enableDuplicateSelect || !this.selectedList.includes(targetName)) &&
                (!this.option.exceptSelf || targetName !== playerName)
            );
        });

        this.nameMap.clear();

        for (let i = 1; i <= targets.length; i++) {
            const target = targets[i - 1];
            const { name: targetName } = target;

            this.nameMap.set(i, targetName);
            this.playerMap.set(targetName, target);

            const selectCount = this.selectCountMap.get(targetName);
            if (selectCount) {
                form.button(`${targetName} (${selectCount}회 선택됨)`);
            } else {
                form.button(targetName);
            }
        }

        if (this.nameMap.size === 0) {
            this.checkSelectedList();
            return null;
        }

        return form;
    }

    async processResult(result: ActionFormResponse) {
        const { selection } = result;
        if (selection === 0) {
            this.checkSelectedList();
            return;
        }

        const name = this.nameMap.getOrThrow(selection!);
        this.selectedList.push(name);

        if (this.option.maxCount > this.nameMap.size) {
            await this.show();
        }
    }

    private checkSelectedList() {
        if (this.selectedList.length === 0) {
            this.cancelReason = "지정할 수 있는 플레이어가 없거나 플레이어가 선택되지 않았습니다";
        }
    }
}
