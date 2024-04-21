import { Entity, EntityHealthComponent, Player, system } from "@minecraft/server";
import { Promisable } from "../type";
import { JobType } from "../data/jobData";
import { SkillType } from "./skillType";
import { CoolRemainProperty, CoolTimeoutProperty, debuffPropertyValues, statPropertyValues } from "../data/propertyData";
import { convertListToObject } from "../utils/objectUtils";
import { getDebuffTime } from "../api/buffApi";
import { isPlayer } from "../utils/entityUtils";
import { clearRun, runInterval } from "../system";

const failReasons = ["stun", "mn", "hp", "cool"] as const;
export type FailReasonType = (typeof failReasons)[number];
export const failReasonValues = convertListToObject(failReasons);

export default abstract class Job {
    constructor(public readonly jobType: JobType) {}

    getHp(entity: Entity): number {
        return (entity.getDynamicProperty(statPropertyValues.hp) ?? 0) as number;
    }

    setHp(entity: Entity, value: number) {
        const fixedValue = Math.max(value, 0);
        entity.setDynamicProperty(statPropertyValues.hp, fixedValue);

        const maxHp = this.getMaxHp(entity);
        if (value > 0) {
            system.run(() => {
                const hearts = ((fixedValue / maxHp) * 200).toFixed(0);
                entity.getComponent(EntityHealthComponent.componentId)?.setCurrentValue(Number(hearts));
            });
        }

        if (maxHp > fixedValue && !entity.getDynamicProperty(statPropertyValues.hpInterval)) {
            const interval = runInterval(
                entity,
                () => {
                    const maxHp = this.getMaxHp(entity);
                    const newValue = Math.min(this.getHp(entity) + this.getHpRegen(entity), maxHp);
                    entity.setDynamicProperty(statPropertyValues.hp, newValue);

                    if (newValue > 0) {
                        const hearts = ((newValue / maxHp) * 200).toFixed(0);
                        entity.getComponent(EntityHealthComponent.componentId)?.setCurrentValue(Number(hearts));
                    }

                    if (newValue === maxHp) {
                        entity.setDynamicProperty(statPropertyValues.hpInterval, undefined);
                        clearRun(entity, interval);
                    }
                },
                20,
            );

            entity.setDynamicProperty(statPropertyValues.hpInterval, interval);
        }
    }

    getMn(entity: Entity): number {
        return (entity.getDynamicProperty(statPropertyValues.mn) ?? 0) as number;
    }

    setMn(entity: Entity, value: number) {
        const fixedValue = Math.max(value, 0);
        entity.setDynamicProperty(statPropertyValues.mn, fixedValue);

        const playerYn = isPlayer(entity);
        if (playerYn) {
            system.run(() => {
                entity.addLevels(fixedValue - entity.level);
            });
        }

        if (this.getMaxMn(entity) > fixedValue && !entity.getDynamicProperty(statPropertyValues.mnInterval)) {
            const interval = runInterval(
                entity,
                () => {
                    const maxMn = this.getMaxMn(entity);
                    const newValue = Math.min(this.getMn(entity) + this.getMnRegen(entity), maxMn);

                    entity.setDynamicProperty(statPropertyValues.mn, newValue);
                    if (playerYn) {
                        entity.addLevels(newValue - entity.level);
                    }

                    if (newValue === maxMn) {
                        entity.setDynamicProperty(statPropertyValues.mnInterval, undefined);
                        clearRun(entity, interval);
                    }
                },
                20,
            );

            entity.setDynamicProperty(statPropertyValues.mnInterval, interval);
        }
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
        return Math.max(endTick - system.currentTick, 0);
    }

    setRemainCool(player: Player, skillType: SkillType, cool: number) {
        player.setDynamicProperty(this.getCoolRemainProperty(skillType), system.currentTick + cool);
    }

    canUseSkill(player: Player, skillType: SkillType): [FailReasonType | null, number] {
        let value = this.getRemainCool(player, skillType);
        if (value) {
            return [failReasonValues.cool, value];
        }

        value = this.getMn(player);
        if (value < this.getMnUse(skillType, player)) {
            return [failReasonValues.mn, value];
        }

        value = this.getHp(player);
        if (value < this.getHpUse(skillType, player)) {
            return [failReasonValues.hp, value];
        }

        value = getDebuffTime(player, debuffPropertyValues.stun);
        if (value) {
            return [failReasonValues.stun, value];
        }

        return [null, 0];
    }

    useSkill(player: Player, skillType: SkillType) {
        const [failReason, failValue] = this.canUseSkill(player, skillType);
        if (failReason) {
            let divideCount: number;
            let invalidMessage: string;
            switch (failReason) {
                case failReasonValues.cool: {
                    const remainCoolSec = Number((0.05 * failValue).toFixed(2));
                    const coolSec = Number((0.05 * this.getSkillCool(skillType, player)).toFixed(2));

                    divideCount = 23;
                    invalidMessage = `§c${this.getKeyName(skillType)}은 아직 쿨타임입니다\n§r[§l${remainCoolSec}/${coolSec}초§r]`;

                    break;
                }

                case failReasonValues.mn: {
                    const mnUse = this.getMnUse(skillType, player);

                    divideCount = 33;
                    invalidMessage = `§c${this.getKeyName(skillType)}을 사용하기에 마나가 부족합니다\n§r[§b§l${failValue}/${mnUse}§r]`;

                    break;
                }

                case failReasonValues.hp: {
                    const hpUse = this.getHpUse(skillType, player);

                    divideCount = 33;
                    invalidMessage = `§c${this.getKeyName(skillType)}을 사용하기에 체력이 부족합니다\n§r[§4§l${failValue}/${hpUse}§r]`;

                    break;
                }

                case failReasonValues.stun: {
                    divideCount = 18;
                    invalidMessage = `§c§l현재 기절상태입니다!`;

                    break;
                }

                default:
                    throw new Error(`Unknown Fail Reason: ${failReason}`);
            }

            player.sendMessage(`${"=".repeat(divideCount)}\n${invalidMessage}`);
            return false;
        }

        // 추후 광역으로 스킬 사용을 감지해야 하는 일이 생기거나 하면 여기 구현하면 됨
        const coolTime = this.getSkillCool(skillType, player);
        this.setRemainCool(player, skillType, coolTime);

        const availableMessage = this.getAvailableMessage(skillType);
        const coolTimeoutProperty = this.getCoolTimeoutProperty(skillType);
        if (skillType !== "left") {
            const coolTimeout = system.runTimeout(() => {
                player.sendMessage(availableMessage);
                player.setDynamicProperty(coolTimeoutProperty, undefined);
            }, coolTime);

            player.setDynamicProperty(coolTimeoutProperty, coolTimeout);
        }

        this.setHp(player, this.getHp(player) - this.getHpUse(skillType, player));
        this.setMn(player, this.getMn(player) - this.getMnUse(skillType, player));

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

    private getKeyName(skillType: SkillType) {
        switch (skillType) {
            case "left":
                return "좌클릭";
            case "right":
                return "우클릭";
            case "key1":
                return "스킬1";
            case "key2":
                return "스킬2";
            case "key3":
                return "스킬3";
            case "key4":
                return "스킬4";
        }
    }

    private getAvailableMessage(skillType: SkillType) {
        return `§b${this.getKeyName(skillType)}§r의 재사용이 가능합니다`;
    }

    abstract getMaxHp(entity: Entity): number;
    abstract getMaxMn(entity: Entity): number;
    abstract getHpRegen(entity: Entity): number;
    abstract getMnRegen(entity: Entity): number;

    // 스킬 종류는 필수고, 플레이어는 필수가 아니어서 순서를 바꿔놓는다
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
