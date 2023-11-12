import { Dimension, Entity, MinecraftDimensionTypes, system, world } from "@minecraft/server";

export const overworld = world.getDimension(MinecraftDimensionTypes.overworld);
export const dimensions: Record<string, Dimension> = {};
dimensions[overworld.id] = overworld;

export type SystemProperty = "log" | "projectile";

let systemEntity: Entity;
const getSystemEntity = () => {
    if (systemEntity) {
        return systemEntity;
    }

    systemEntity = Array.from(overworld.getEntities({ name: "system" }))[0];
    return systemEntity;
};

export const setProperty = (propertyId: SystemProperty, value?: string) => {
    getSystemEntity().setDynamicProperty(propertyId, value);
};

export const getProperty = <T>(propertyId: SystemProperty): T | undefined => {
    const property = getSystemEntity().getDynamicProperty(propertyId);
    if (property === undefined) {
        return undefined as T;
    }

    return JSON.parse(property as string) as T;
};

export const registerEvent = (func: () => void) => {
    const checkSystemEntityAndRegister = () => {
        if (!getSystemEntity()) {
            return false;
        }

        world.afterEvents.worldInitialize.unsubscribe(checkSystemEntityAndRegister);
        system.runInterval(func);

        return true;
    };

    world.afterEvents.worldInitialize.subscribe(() => {
        const runId = system.runInterval(() => {
            if (checkSystemEntityAndRegister()) {
                system.clearRun(runId);
            }
        });
    });
};
