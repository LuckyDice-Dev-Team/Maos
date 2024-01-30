import Job from "../../type/jobType";
import { Player } from "@minecraft/server";
import { spawnProjectile } from "../../api/projectileApi";
import { getProjectileData } from "../projectileData";
import { Promisable } from "../../type";
import { SkillType } from "../../type/skillType";

export default class IceMagician extends Job {
    getMaxHp() {
        return 1000;
    }

    getMaxMn() {
        return 200;
    }

    getHpRegen() {
        return 15;
    }

    getMnRegen() {
        return 10;
    }

    getHpUse() {
        return 0;
    }

    getMnUse(skillType: SkillType) {
        switch (skillType) {
            case "left":
                return 20;

            case "right":
                return 0;

            case "key1":
                return 0;

            case "key2":
                return 0;

            case "key3":
                return 0;

            case "key4":
                return 0;
        }
    }

    getSkillCool(skillType: SkillType) {
        switch (skillType) {
            case "left":
                return 20;

            case "right":
                return 0;

            case "key1":
                return 0;

            case "key2":
                return 0;

            case "key3":
                return 0;

            case "key4":
                return 0;
        }
    }

    leftClick(player: Player) {
        spawnProjectile(player, getProjectileData(this.jobType, 1));
    }

    rightClick(player: Player): Promisable<void> {}

    key1(player: Player): Promisable<void> {}

    key2(player: Player): Promisable<void> {}

    key3(player: Player): Promisable<void> {}

    key4(player: Player): Promisable<void> {}
}
