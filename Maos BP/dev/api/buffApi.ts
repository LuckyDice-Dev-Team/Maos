import { DebuffProperty, DebuffTimeoutProperty } from "../data/propertyData";
import { Entity, system } from "@minecraft/server";
import { InputPermission, setInputPermission } from "../utils/commandUtils";
import { isPlayer } from "../utils/entityUtils";
import { clearRun, runInterval, run } from "../system";

export const getDebuffTime = (entity: Entity, debuff: DebuffProperty) => {
    const value = entity.getDynamicProperty(debuff);
    if (!value) {
        return 0;
    }

    return Math.max(0, (value as number) - system.currentTick);
};

export const getTimeoutProperty = (debuff: DebuffProperty): DebuffTimeoutProperty | null => {
    switch (debuff) {
        case "stun":
            return "stunTimeout";
        case "pin":
            return "pinTimeout";
        default:
            return null;
    }
};

export const getCurrentInputPermission = (entity: Entity): InputPermission => {
    if (getDebuffTime(entity, "stun")) {
        return "stun";
    } else if (getDebuffTime(entity, "pin")) {
        return "pin";
    }

    return "free";
};

export const setDebuffActionbar = (entity: Entity) => {
    if (!isPlayer(entity)) {
        return;
    }

    let actionbarText = "§r";
    switch (getCurrentInputPermission(entity)) {
        case "stun": {
            actionbarText = "§4§l기절";
            break;
        }

        case "pin": {
            actionbarText = "§c§l속박";
            break;
        }

        default:
            break;
    }

    entity.runCommand(`titleraw @s actionbar {"rawtext": [{"text": "${actionbarText}"}]}`);
};

export const setDebuff = (entity: Entity | undefined, debuff: DebuffProperty, time: number) => {
    if (!entity) {
        console.warn("Tried to set debuff to undefined");
        return;
    }

    const debuffTime = Math.max(getDebuffTime(entity, debuff), time);
    entity.setDynamicProperty(debuff, debuffTime + system.currentTick);
    run(entity, () => {
        setInputPermission(entity, getCurrentInputPermission(entity));
        setDebuffActionbar(entity);
    });

    const interval = runInterval(
        entity,
        () => {
            setDebuffActionbar(entity);
        },
        20,
    );

    const timeoutProperty = getTimeoutProperty(debuff);
    if (!timeoutProperty) {
        return;
    }

    const prevTimeout = entity.getDynamicProperty(timeoutProperty) as number;
    if (prevTimeout) {
        system.clearRun(prevTimeout);
    }

    const timeout = system.runTimeout(() => {
        entity.setDynamicProperty(debuff, undefined);
        setInputPermission(entity, getCurrentInputPermission(entity));
        setDebuffActionbar(entity);

        clearRun(entity, interval);
    }, debuffTime);

    entity.setDynamicProperty(timeoutProperty, timeout);
};
