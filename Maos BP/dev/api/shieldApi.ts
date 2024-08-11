import { Entity, MolangVariableMap, system } from "@minecraft/server";
import { shieldPropertyValues } from "../data/propertyData";
import { trySpawnParticle } from "../utils/particleUtils";

const shieldCount = [20, 130] as const;
const shieldColor = {
    r: [
        [0.3568, 0.0078],
        [0.3961, 0.2431],
    ],
    g: [
        [1, 0.2667],
        [0.3569, 0.0078],
    ],
    b: [
        [0.5647, 0.3255],
        [1, 0.3255],
    ],
} as const;

const getRandomColor = (value: number, maxValue: number, array: typeof shieldColor.r | typeof shieldColor.g | typeof shieldColor.b) => {
    const percent = Math.min(1, value / maxValue);
    const minPercentValue = (array[1][0] - array[0][0]) * percent + array[0][0];
    const maxPercentValue = (array[1][1] - array[0][1]) * percent + array[0][1];

    return Math.random() * (maxPercentValue - minPercentValue) + minPercentValue;
};

export const getShield = (entity: Entity) => {
    return Number(entity.getDynamicProperty(shieldPropertyValues.shield) ?? 0);
};

export const setShield = (entity: Entity, value: number) => {
    const fixedValue = Math.max(value, 0);
    entity.setDynamicProperty(shieldPropertyValues.shield, fixedValue);

    if (!entity.getDynamicProperty(shieldPropertyValues.shieldInterval) && fixedValue > 0) {
        const particleInterval = system.runInterval(() => {
            if (!entity.isValid()) {
                return;
            }

            const shield = getShield(entity);
            const shieldPercent = Math.min(1, shield / 500);

            const count = Math.max(shieldCount[0], (shieldCount[1] + shieldCount[0]) * shieldPercent);
            const red = getRandomColor(shield, 500, shieldColor.r);
            const green = getRandomColor(shield, 500, shieldColor.g);
            const blue = getRandomColor(shield, 500, shieldColor.b);

            const map = new MolangVariableMap();
            map.setFloat("variable.count", count);
            map.setFloat("variable.r", red);
            map.setFloat("variable.g", green);
            map.setFloat("variable.b", blue);

            trySpawnParticle(entity.dimension, `maos:common_shield`, entity.location, map);
        });

        const interval = system.runInterval(() => {
            if (!entity.isValid()) {
                return;
            }

            let newValue = getShield(entity);
            if (newValue < 150) {
                newValue -= 8;
            } else if (newValue < 300) {
                newValue -= 12;
            } else if (newValue < 500) {
                newValue -= 20;
            } else {
                newValue -= 30;
            }

            newValue = Math.max(newValue, 0);
            entity.setDynamicProperty(shieldPropertyValues.shield, newValue);

            if (newValue === 0) {
                entity.setDynamicProperty(shieldPropertyValues.shieldInterval, undefined);
                system.clearRun(interval);
                system.clearRun(particleInterval);
            }
        }, 10);

        entity.setDynamicProperty(shieldPropertyValues.shieldInterval, interval);
        entity.setDynamicProperty(shieldPropertyValues.shieldParticleInterval, particleInterval);
    }
};
