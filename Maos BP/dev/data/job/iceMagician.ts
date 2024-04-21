import Job from "../../type/jobType";
import { Player, system } from "@minecraft/server";
import { spawnProjectile } from "../../api/projectileApi";
import { getProjectileData } from "../projectileData";
import { Promisable } from "../../type";
import { SkillType } from "../../type/skillType";
import { getShield, setShield } from "../../api/shieldApi";
import { clearRun, run, runInterval, runTimeout } from "../../system";
import { getAllies, getEnemies, getEnemiesFromViewDirection } from "../../api/entityApi";
import { damage } from "../../api/damageApi";
import { getDebuffTime } from "../../api/buffApi";

export default class IceMagician extends Job {
    getMaxHp() {
        return 1500;
    }

    getMaxMn() {
        return 200;
    }

    getHpRegen() {
        return 15;
    }

    getMnRegen() {
        return 20;
    }

    getHpUse() {
        return 0;
    }

    getMnUse(skillType: SkillType) {
        switch (skillType) {
            case "left":
                return 15;

            case "right":
                return 35;

            case "key1":
                return 60;

            case "key2":
                return 60;

            case "key3":
                return 100;

            case "key4":
                return 0;
        }
    }

    getSkillCool(skillType: SkillType) {
        switch (skillType) {
            case "left":
                return 20;

            case "right":
                return 100;

            case "key1":
                return 240;

            case "key2":
                return 300;

            case "key3":
                return 400;

            case "key4":
                return 0;
        }
    }

    leftClick(player: Player) {
        spawnProjectile(player, getProjectileData(this.jobType, 1));
    }

    rightClick(player: Player) {
        spawnProjectile(player, getProjectileData(this.jobType, 2));
    }

    key1(player: Player) {
        getAllies(player, {
            maxDistance: 12,
        }).forEach((ally) => {
            system.run(() => {
                ally.dimension.spawnParticle("maos:ice_magician_3", {
                    ...ally.location,
                    y: ally.location.y + 0.6,
                });
            });

            setShield(ally, getShield(ally) + 200);
        });
    }

    key2(player: Player) {
        const interval = runInterval(
            player,
            () => {
                player.dimension.spawnParticle("maos:ice_magician_4", {
                    ...player.location,
                    y: player.location.y + 0.1,
                });

                getEnemies(player, {
                    maxDistance: 12,
                }).forEach((enemy) => {
                    damage(12, player, enemy);
                    enemy.addEffect("slowness", 5);
                });
            },
            5,
        );

        runTimeout(player, () => clearRun(player, interval), 120);
    }

    key3(player: Player) {
        const [target] = getEnemiesFromViewDirection(player, { maxDistance: 16 }).filter(
            ({ entity }) => getDebuffTime(entity, "stun") || getDebuffTime(entity, "pin"),
        );

        if (!target) {
            player.sendMessage(`${"=".repeat(32)}\n§c§l기절 또는 속박 상태의 대상을 찾지 못했습니다`);
            this.setMn(player, this.getMn(player) + this.getMnUse("key3"));
            this.setRemainCool(player, "key3", 0);

            return;
        }

        getAllies(target.entity, {
            maxDistance: 16,
        }).forEach((enemy) => {
            run(target.entity, () => {
                damage(150, player, enemy);
                enemy.addEffect("slowness", 60, {
                    amplifier: 1,
                });
            });
        });
    }

    key4(player: Player): Promisable<void> {}
}
