import { Entity } from "@minecraft/server";
import { shieldPropertyValues } from "../data/propertyData";
import { clearRun, runInterval } from "../system";

export const getShield = (entity: Entity) => {
    return (entity.getDynamicProperty(shieldPropertyValues.shield) ?? 0) as number;
};

export const setShield = (entity: Entity, value: number) => {
    entity.setDynamicProperty(shieldPropertyValues.shield, Math.max(value, 0));

    if (!entity.getDynamicProperty(shieldPropertyValues.shieldInterval)) {
        const interval = runInterval(
            entity,
            () => {
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
                    clearRun(entity, interval);
                }
            },
            10,
        );

        entity.setDynamicProperty(shieldPropertyValues.shieldInterval, interval);
    }
};
