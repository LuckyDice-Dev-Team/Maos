import { DebuffProperty, DebuffTimeoutProperty, ValuedDebuffProperty, ValuedDebuffTimeoutProperty } from "../data/propertyData";
import { Entity, system } from "@minecraft/server";
import { InputPermission, setInputPermission } from "../utils/commandUtils";
import { isPlayer } from "../utils/entityUtils";
import OptionalMap from "../object/optionalMap";

export const getDebuffTime = (entity: Entity, debuff: DebuffProperty) => {
    const value = entity.getDynamicProperty(debuff);
    if (!value) {
        return 0;
    }

    return Math.max(0, (value as number) - system.currentTick);
};

const getTimeoutProperty = (debuff: DebuffProperty): DebuffTimeoutProperty => {
    switch (debuff) {
        case "stun":
            return "stunTimeout";
        case "pin":
            return "pinTimeout";
    }
};

const getCurrentInputPermission = (entity: Entity): InputPermission => {
    if (getDebuffTime(entity, "stun")) {
        return "stun";
    } else if (getDebuffTime(entity, "pin")) {
        return "pin";
    }

    return "free";
};

const setDebuffActionbar = (entity: Entity, currentInputPermission: InputPermission) => {
    if (!isPlayer(entity)) {
        return;
    }

    let actionbarText = "§r";
    switch (currentInputPermission) {
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

export const applyDebuff = (entity: Entity | undefined, debuff: DebuffProperty, time: number) => {
    if (!entity) {
        console.warn("Tried to set debuff to undefined");
        return;
    }

    const debuffTime = Math.max(getDebuffTime(entity, debuff), time);
    entity.setDynamicProperty(debuff, debuffTime + system.currentTick);
    system.run(() => {
        const inputPermission = getCurrentInputPermission(entity);

        setInputPermission(entity, inputPermission);
        setDebuffActionbar(entity, inputPermission);
    });

    const actionbarInterval = system.runInterval(() => {
        if (!entity.isValid()) {
            return;
        }

        const inputPermission = getCurrentInputPermission(entity);

        setDebuffActionbar(entity, inputPermission);
        if (inputPermission === "free") {
            system.clearRun(actionbarInterval);
            console.warn("Clear Interval");
        }
    }, 20);

    const timeoutProperty = getTimeoutProperty(debuff);
    const prevTimeout = entity.getDynamicProperty(timeoutProperty) as number | undefined;
    if (prevTimeout) {
        system.clearRun(prevTimeout);
    }

    const timeout = system.runTimeout(() => {
        if (!entity.isValid()) {
            return;
        }

        entity.setDynamicProperty(debuff, undefined);
        entity.setDynamicProperty(timeoutProperty, undefined);
        setInputPermission(entity, "free");
        setDebuffActionbar(entity, "free");

        system.clearRun(actionbarInterval);
    }, debuffTime);

    entity.setDynamicProperty(timeoutProperty, timeout);
};

export const getValuedDebuff = (
    entity: Entity,
    debuff: ValuedDebuffProperty,
): {
    value: number;
    time: number;
} => {
    const property = entity.getDynamicProperty(debuff);
    if (!property) {
        return {
            value: 0,
            time: system.currentTick,
        };
    }

    const [value, time] = (property as string).split("|");
    return {
        value: Number(value) || 0,
        time: Number(time) || system.currentTick,
    };
};

const getValuedTimeoutProperty = (debuff: ValuedDebuffProperty): ValuedDebuffTimeoutProperty => {
    switch (debuff) {
        case "slow":
            return "slowTimeout";
    }
};

const getRealValuedDebuff = (entity: Entity, value?: number, time?: number) => {
    let realValue = value;
    let realTime = time;
    if (value === undefined || time === undefined) {
        const propertyValue = getValuedDebuff(entity, "slow");
        realValue = propertyValue.value;
        realTime = propertyValue.time - system.currentTick;
    }

    return { realValue, realTime };
};

export const valuedDebuffActionMap = new OptionalMap<ValuedDebuffProperty, (entity: Entity, value?: number, time?: number) => boolean>();
valuedDebuffActionMap.set("slow", (entity, value, time) => {
    const { realValue, realTime } = getRealValuedDebuff(entity, value, time);
    console.warn(value, time, realValue, realTime);

    if ((realTime || 0) <= 0) {
        entity.removeEffect("slowness");
        return false;
    }

    entity.addEffect("slowness", 20, { amplifier: realValue });
    return true;
});

export const applyValuedDebuff = (entity: Entity | undefined, debuff: ValuedDebuffProperty, value: number, time: number) => {
    if (!entity) {
        console.warn("Tried to set valued debuff to undefined");
        return;
    }

    const { value: currentValue, time: remainTime } = getValuedDebuff(entity, debuff);
    const timeoutProperty = getValuedTimeoutProperty(debuff);
    const actionFunc = valuedDebuffActionMap.getOrThrow(debuff);

    let newTime: number;
    let newProperty: string;
    if (!currentValue || !remainTime) {
        newTime = system.currentTick + time;
        newProperty = `${value}|${newTime}`;

        actionFunc(entity, value, time);
    } else if (currentValue >= value) {
        newTime = remainTime + (time * value) / currentValue;
        newProperty = `${currentValue}|${newTime}`;
    } else {
        newTime = time + (remainTime * currentValue) / value;
        newProperty = `${value}|${newTime}`;
    }

    entity.setDynamicProperty(debuff, newProperty);
    if (entity.getDynamicProperty(timeoutProperty)) {
        return;
    }

    const interval = system.runInterval(() => {
        if (!entity.isValid()) {
            return;
        }

        if (actionFunc(entity)) {
            return;
        }

        entity.setDynamicProperty(debuff, undefined);
        entity.setDynamicProperty(timeoutProperty, undefined);
        system.clearRun(interval);
    });

    entity.setDynamicProperty(timeoutProperty, interval);
};
