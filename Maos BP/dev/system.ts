import { Dimension, Entity, MinecraftDimensionTypes, system, world, WorldInitializeAfterEvent } from "@minecraft/server";
import { SystemProperty } from "./data/propertyData";

export const opList = ["namsic", "namsic6460"];

export const overworld = world.getDimension(MinecraftDimensionTypes.overworld);
export const dimensions: Record<string, Dimension> = {};
dimensions[overworld.id] = overworld;

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
    let worldInitializeCallback: (arg: WorldInitializeAfterEvent) => void;

    const checkSystemEntityAndRegister = () => {
        if (!getSystemEntity()) {
            return false;
        }

        world.afterEvents.worldInitialize.unsubscribe(worldInitializeCallback);
        system.runInterval(func);

        return true;
    };

    worldInitializeCallback = () => {
        const runId = system.runInterval(() => {
            if (checkSystemEntityAndRegister()) {
                system.clearRun(runId);
            }
        });
    };

    world.afterEvents.worldInitialize.subscribe(worldInitializeCallback);
};
