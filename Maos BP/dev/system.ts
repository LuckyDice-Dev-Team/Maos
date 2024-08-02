import { Dimension, Entity, MinecraftDimensionTypes, system, world, WorldInitializeAfterEvent } from "@minecraft/server";
import { SystemProperty, systemPropertyValues } from "./data/propertyData";

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

const getRunIds = (entity: Entity) => {
    return JSON.parse((entity.getDynamicProperty(systemPropertyValues.runIds) ?? "[]") as string) as number[];
};

const setRunIds = (entity: Entity, runIds: number[]) => {
    if (!runIds.length) {
        entity.setDynamicProperty(systemPropertyValues.runIds, undefined);
    }

    entity.setDynamicProperty(systemPropertyValues.runIds, JSON.stringify(runIds));
};

export const run = (entity: Entity, callback: () => void) => {
    const runId = system.run(() => {
        callback();
        clearRun(entity, runId, false);
    });
    const runIds = getRunIds(entity);

    runIds.push(runId);
    setRunIds(entity, runIds);

    return runId;
};

export const runTimeout = (entity: Entity, callback: () => void, tick: number) => {
    const runId = system.runTimeout(() => {
        callback();
        clearRun(entity, runId, false);
    }, tick);
    const runIds = getRunIds(entity);

    runIds.push(runId);
    setRunIds(entity, runIds);

    return runId;
};

export const runInterval = (entity: Entity, callback: () => void, tick: number) => {
    const runId = system.runInterval(callback, tick);
    const runIds = getRunIds(entity);

    runIds.push(runId);
    setRunIds(entity, runIds);

    return runId;
};

export const clearRun = (entity: Entity, runId: number, isInterval: boolean = true) => {
    if (isInterval) {
        system.clearRun(runId);
    }

    const runIds = getRunIds(entity);
    const index = runIds.indexOf(runId);
    if (index !== -1) {
        runIds.splice(index, 1);
    }
};
