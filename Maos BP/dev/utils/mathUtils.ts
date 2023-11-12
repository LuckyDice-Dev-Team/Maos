import { Vector3 } from "@minecraft/server";

export const getDistance = (vector1: Vector3, vector2: Vector3) => {
    return Math.sqrt((vector1.x - vector2.x) ** 2 + (vector1.y - vector2.y) ** 2 + (vector1.z - vector2.z) ** 2);
};

export const sumVector = (vector: Vector3) => {
    return vector.x + vector.y + vector.z;
};

export const floorVector = (vector: Vector3) => {
    return {
        x: Math.floor(vector.x),
        y: Math.floor(vector.y),
        z: Math.floor(vector.z),
    };
};

export const calcVector = (vector: Vector3, value: number, func: (value1: number, value2: number) => number) => {
    return {
        x: func(vector.x, value),
        y: func(vector.y, value),
        z: func(vector.z, value),
    };
};

export const calcVectors = (vector: Vector3, value: Vector3, func: (value1: number, value2: number) => number) => {
    return {
        x: func(vector.x, value.x),
        y: func(vector.y, value.y),
        z: func(vector.z, value.z),
    };
};
