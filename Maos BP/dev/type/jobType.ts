import { Player, system } from "@minecraft/server";
import { Promisable } from "../type";
import { JobType } from "../data/jobData";
import { SkillType } from "./skillType";
import { buffPropertyValues, CoolRemainProperty, CoolTimeoutProperty, statPropertyValues } from "../data/propertyData";

export default abstract class Job {
    constructor(public readonly jobType: JobType) {

    }

    getHp(player: Player): number {
        return (player.getDynamicProperty(statPropertyValues.hp) ?? 0) as number;
    }

    setHp(player: Player, value: number) {
        player.setDynamicProperty(statPropertyValues.hp, value);
    }

    getMn(player: Player): number {
        return (player.getDynamicProperty(statPropertyValues.mn) ?? 0) as number;
    }

    setMn(player: Player, value: number) {
        player.setDynamicProperty(statPropertyValues.mn, value);
    }

    protected getCoolRemainProperty(skillType: SkillType): CoolRemainProperty {
        switch (skillType) {
            case "left":
                return "remain_left";
            case "right":
                return "remain_right";
            case "key1":
                return "remain_1";
            case "key2":
                return "remain_2";
            case "key3":
                return "remain_3";
            case "key4":
                return "remain_4";
        }
    }

    protected getCoolTimeoutProperty(skillType: SkillType): CoolTimeoutProperty {
        switch (skillType) {
            case "left":
                return "timeout_left";
            case "right":
                return "timeout_right";
            case "key1":
                return "timeout_1";
            case "key2":
                return "timeout_2";
            case "key3":
                return "timeout_3";
            case "key4":
                return "timeout_4";
        }
    }

    getRemainCool(player: Player, skillType: SkillType): number {
        const endTick = (player.getDynamicProperty(this.getCoolRemainProperty(skillType)) ?? Number.MIN_VALUE) as number;
        return Math.min(endTick - system.currentTick, 0);
    }

    canUseSkill(player: Player, skillType: SkillType) {
        return (
            !player.getDynamicProperty(buffPropertyValues.debuffCount) &&
            this.getMn(player) >= this.getMnUse(skillType, player) &&
            this.getHp(player) >= this.getHpUse(skillType, player) &&
            !this.getRemainCool(player, skillType)
        );
    }

    useSkill(player: Player, skillType: SkillType) {
        if (!this.canUseSkill(player, skillType)) {
            return false;
        }

        // 추후 광역으로 스킬 사용을 감지해야 하는 일이 생기거나 하면 여기 구현하면 됨
        const coolTime = this.getSkillCool(skillType, player);
        player.setDynamicProperty(this.getCoolRemainProperty(skillType), system.currentTick + coolTime);

        const coolTimeoutProperty = this.getCoolTimeoutProperty(skillType);
        const coolTimeout = system.runTimeout(() => {
            player.sendMessage(this.getAvailableMessage(skillType));
            player.setDynamicProperty(coolTimeoutProperty, undefined);
        }, coolTime);

        player.setDynamicProperty(coolTimeoutProperty, coolTimeout);

        switch (skillType) {
            case "left": {
                this.leftClick(player);
                break;
            }

            case "right": {
                this.rightClick(player);
                break;
            }

            case "key1": {
                this.key1(player);
                break;
            }

            case "key2": {
                this.key2(player);
                break;
            }

            case "key3": {
                this.key3(player);
                break;
            }

            case "key4": {
                this.key4(player);
                break;
            }
        }

        return true;
    }

    getAvailableMessage(skillType: SkillType) {
        let key;
        switch (skillType) {
            case "left": {
                key = "좌클릭";
                break;
            }

            case "right": {
                key = "우클릭";
                break;
            }

            case "key1": {
                key = "스킬1";
                break;
            }

            case "key2": {
                key = "스킬2";
                break;
            }

            case "key3": {
                key = "스킬3";
                break;
            }

            case "key4": {
                key = "스킬4";
                break;
            }
        }

        return `§b${key}§r의 재사용이 가능합니다`;
    }

    abstract getMaxHp(): number;
    abstract getMaxMn(): number;
    abstract getHpUse(skillType: SkillType, player: Player): number;
    abstract getMnUse(skillType: SkillType, player: Player): number;

    abstract getSkillCool(skillType: SkillType, player: Player): number;

    abstract leftClick(player: Player): Promisable<void>;
    abstract rightClick(player: Player): Promisable<void>;
    abstract key1(player: Player): Promisable<void>;
    abstract key2(player: Player): Promisable<void>;
    abstract key3(player: Player): Promisable<void>;
    abstract key4(player: Player): Promisable<void>;
}
