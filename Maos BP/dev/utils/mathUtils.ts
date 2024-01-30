import { Vector3 } from "@minecraft/server";

export const sumVector = (vector: Vector3) => {
    return vector.x + vector.y + vector.z;
};

export const calcVectors = (vector: Vector3, value: Vector3, func: (value1: number, value2: number) => number) => {
    return {
        x: func(vector.x, value.x),
        y: func(vector.y, value.y),
        z: func(vector.z, value.z),
    };
};

export const calcVectorLength = (vector: Vector3) => {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
};
