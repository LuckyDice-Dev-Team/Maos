import Job from "../../type/jobType";
import { MolangVariableMap, Player, system } from "@minecraft/server";
import { spawnProjectile } from "../../api/projectileApi";
import { getProjectileData } from "../projectileData";
import { SkillType } from "../../type/skillType";
import { getShield, setShield } from "../../api/shieldApi";
import { getAllies, getEnemies, getEnemiesFromViewDirection } from "../../api/entityApi";
import { damage } from "../../api/damageApi";
import { getDebuffTime, setDebuff } from "../../api/buffApi";
import { trySpawnParticle } from "../../utils/particleUtils";
import { Space } from "../../space/space";

export default class IceMagician extends Job {
    getMaxHp() {
        return 2000;
    }

    getMaxMn() {
        return 200;
    }

    getHpRegen() {
        return 18;
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
                return 45;

            case "key2":
                return 60;

            case "key3":
                return 40;

            case "key4":
                return 100;
        }
    }

    getSkillCool(skillType: SkillType) {
        switch (skillType) {
            case "left":
                return 20;

            case "right":
                return 90;

            case "key1":
                return 150;

            case "key2":
                return 270;

            case "key3":
                return 60;

            case "key4":
                return 1200;
        }
    }

    /**
     투사체를 발사하여 적중하는 적 1명에게 데미지
     */
    leftClick(player: Player) {
        player.dimension.playSound("job.ice_magician.left.use", player.location);
        spawnProjectile(player, getProjectileData(this.jobType, 1));
    }

    /**
     * 투사체를 발사하여 적중하는 적 1명에게 데미지 + 구속 1.5초
     */
    rightClick(player: Player) {
        player.dimension.playSound("job.ice_magician.right.use", player.location);
        spawnProjectile(player, getProjectileData(this.jobType, 2));
    }

    /**
     * 12칸 내 본인 포함 아군에게 실드 200
     */
    key1(player: Player) {
        getAllies(player, {
            maxDistance: 12,
        }).forEach((ally) => {
            system.run(() => {
                trySpawnParticle(ally.dimension, "maos:ice_magician_3", {
                    ...ally.location,
                    y: ally.location.y + 0.6,
                });
            });

            ally.dimension.playSound("job.ice_magician.skill1.use", ally.location);
            setShield(ally, getShield(ally) + 200);
        });
    }

    /**
     * 6초간 5틱마다 주변 12칸 적에게 18데미지 + 구속0 5틱
     */
    key2(player: Player) {
        const interval = system.runInterval(() => {
            if (!player.isValid()) {
                return;
            }

            player.dimension.playSound("job.ice_magician.skill2.tick", player.location);
            trySpawnParticle(player.dimension, "maos:ice_magician_4_tick1", {
                ...player.location,
                y: player.location.y + 0.1,
            });

            getEnemies(player, {
                maxDistance: 12,
            }).forEach((enemy) => {
                const hitLocation = {
                    ...enemy.location,
                    y: enemy.location.y + 0.9,
                };

                enemy.dimension.playSound("job.ice_magician.skill2.hit", enemy.location);
                trySpawnParticle(enemy.dimension, "maos:common_hit", hitLocation);
                trySpawnParticle(enemy.dimension, "maos:ice_magician_4_hit1", hitLocation);
                trySpawnParticle(enemy.dimension, "maos:ice_magician_4_hit2", { ...hitLocation, y: hitLocation.y - 0.8 });

                damage(18, player, enemy);
                enemy.addEffect("slowness", 5);
            });
        }, 5);

        system.runTimeout(() => system.clearRun(interval), 120);
    }

    /**
     * 전방 12칸 바라보는 범위 내 기절 또는 속박 상태의 적 1명과 5칸 이내 동일 팀에게 100(대상은 250) 데미지 + 구속1 3초
     */
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

        const targetEntity = target.entity;
        player.dimension.playSound("job.ice_magician.skill3.hit", targetEntity.location);

        getAllies(targetEntity, { maxDistance: 5 }).forEach((enemy) => {
            system.run(() => {
                let damageValue = 100;
                if (enemy.id === targetEntity.id) {
                    damageValue = 250;

                    trySpawnParticle(enemy.dimension, "maos:ice_magician_5_hit1", {
                        ...enemy.location,
                        y: enemy.location.y + 0.1,
                    });
                }

                damage(damageValue, player, enemy);
                enemy.addEffect("slowness", 60, {
                    amplifier: 1,
                });

                trySpawnParticle(enemy.dimension, "maos:ice_magician_5_hit2", {
                    ...enemy.location,
                    y: enemy.location.y + 1,
                });

                trySpawnParticle(enemy.dimension, "maos:common_hit", {
                    ...enemy.location,
                    y: enemy.location.y + 0.9,
                });
            });
        });
    }

    /**
     * 전방 10칸 바라보는 범위 내 적 1명 200데미지 + 3초 기절 + 구속2 5초, 2초 후 해당 위치 주변 3칸 내 적 동일팀 500데미지, 주변 8칸 내 동일 팀 [~4.0, 0.3] 파워로 넉백
     */
    key4(player: Player) {
        const [target] = getEnemiesFromViewDirection(player, { maxDistance: 10 });
        if (!target) {
            player.sendMessage(`${"=".repeat(21)}\n§c§l대상을 찾지 못했습니다`);
            this.setMn(player, this.getMn(player) + this.getMnUse("key4"));
            this.setRemainCool(player, "key4", 0);

            return;
        }

        const targetEntity = target.entity;
        const hitLocation = targetEntity.location;
        const dimension = targetEntity.dimension;

        damage(200, player, targetEntity);
        setDebuff(targetEntity, "stun", 50);
        targetEntity.addEffect("slowness", 100, { amplifier: 2 });

        const controlLocation = Space.getByValue(5, 0, 0);
        const particleLocation = { ...hitLocation, y: hitLocation.y + 1 };
        for (let i = 0; i < 8; ++i) {
            controlLocation.yTilt(Math.PI / 4);

            const variableMap = new MolangVariableMap();
            variableMap.setFloat("variable.x", controlLocation.x);
            variableMap.setFloat("variable.z", controlLocation.z);

            trySpawnParticle(dimension, "maos:ice_magician_6_hit1", particleLocation, variableMap);
            trySpawnParticle(dimension, "maos:ice_magician_6_hit5", particleLocation, variableMap);
        }

        trySpawnParticle(dimension, "maos:ice_magician_6_hit2", hitLocation);
        trySpawnParticle(dimension, "maos:ice_magician_6_hit6", hitLocation);
        dimension.playSound("job.ice_magician.skill4.use1", hitLocation);

        system.runTimeout(() => {
            dimension.playSound("job.ice_magician.skill4.use2", hitLocation);
        }, 35);

        system.runTimeout(() => {
            if (!targetEntity.isValid()) {
                return;
            }

            trySpawnParticle(dimension, "maos:ice_magician_6_hit3", particleLocation);
            trySpawnParticle(dimension, "maos:ice_magician_6_hit4", particleLocation);
            trySpawnParticle(dimension, "maos:ice_magician_6_hit7", hitLocation);

            getAllies(targetEntity, { maxDistance: 3 }, false, hitLocation).forEach((target) => {
                damage(500, player, target);
            });

            getAllies(targetEntity, { maxDistance: 8 }, false, hitLocation).forEach((target) => {
                const { x, z } = target.location;
                const directionX = x - hitLocation.x;
                const directionZ = z - hitLocation.z;

                // 최대 거리 8에 최대 파워 4이니 2로 나누는게 정확하지만, 아무리 멀어도 조금은 밀려나도록 설정
                const horizontalStrength = 4 - (directionX + directionZ) / 1.8;

                target.applyKnockback(directionX, directionZ, horizontalStrength, 0.3);
            });
        }, 40);
    }
}
