import { Vector3 } from "@minecraft/server";
import { sumVector } from "./mathUtils";

// <= 1
const POINT_GAP = 0.7;

export const getDiffVector = (startLocation: Vector3, endLocation: Vector3) => {
    return {
        x: Math.abs(Math.floor(startLocation.x) - Math.floor(endLocation.x)),
        y: Math.abs(Math.floor(startLocation.y) - Math.floor(endLocation.y)),
        z: Math.abs(Math.floor(startLocation.z) - Math.floor(endLocation.z)),
    };
};

/**
 *  tempX = startLocation.x + t * directionVector.x
 * tempX - startLocation.x = t * directionVector.x
 * t = (tempX - startLocation.x) / directionVector.x
 */
const getTValue = (tempValue: number, startValue: number, directionValue: number) => {
    return (tempValue - startValue) / directionValue;
};

const getLocationWithT = (startValue: number, directionValue: number, tValue: number) => {
    return startValue + tValue * directionValue;
};

/**
 * @param skipCorrect 교점을 구한 후 첫번째 교점이 맞는지를 확인하고 보정하는 프로세스를 건너뛴다
 */
const getIntersectionVector = (startLocation: Vector3, directionVector: Vector3, diffVector: Vector3, skipCorrect = false) => {
    let tValue: number;
    if (diffVector.x === 0) {
        tValue = getTValue(Math.floor(startLocation.y + 1), startLocation.y, directionVector.y);

        const z = getLocationWithT(startLocation.z, directionVector.z, tValue);
        if (skipCorrect || Math.floor(startLocation.z) === Math.floor(z)) {
            return {
                z,
                x: getLocationWithT(startLocation.x, directionVector.x, tValue),
                y: getLocationWithT(startLocation.y, directionVector.y, tValue),
            };
        } else {
            tValue = getTValue(Math.floor(startLocation.z + 1), startLocation.z, directionVector.z);

            return {
                x: getLocationWithT(startLocation.x, directionVector.x, tValue),
                y: getLocationWithT(startLocation.y, directionVector.y, tValue),
                z: getLocationWithT(startLocation.z, directionVector.z, tValue),
            };
        }
    } else if (diffVector.y === 0) {
        tValue = getTValue(Math.floor(startLocation.z + 1), startLocation.z, directionVector.z);

        const x = getLocationWithT(startLocation.x, directionVector.x, tValue);
        if (skipCorrect || Math.floor(startLocation.x) === Math.floor(x)) {
            return {
                x,
                y: getLocationWithT(startLocation.y, directionVector.y, tValue),
                z: getLocationWithT(startLocation.z, directionVector.z, tValue),
            };
        } else {
            tValue = getTValue(Math.floor(startLocation.x + 1), startLocation.x, directionVector.x);

            return {
                x: getLocationWithT(startLocation.x, directionVector.x, tValue),
                y: getLocationWithT(startLocation.y, directionVector.y, tValue),
                z: getLocationWithT(startLocation.z, directionVector.z, tValue),
            };
        }
    } else {
        tValue = getTValue(Math.floor(startLocation.x + 1), startLocation.x, directionVector.x);

        const y = getLocationWithT(startLocation.y, directionVector.y, tValue);
        if (skipCorrect || Math.floor(startLocation.y) === Math.floor(y)) {
            return {
                y,
                x: getLocationWithT(startLocation.x, directionVector.x, tValue),
                z: getLocationWithT(startLocation.z, directionVector.z, tValue),
            };
        } else {
            tValue = getTValue(Math.floor(startLocation.y + 1), startLocation.y, directionVector.y);

            return {
                x: getLocationWithT(startLocation.x, directionVector.x, tValue),
                y: getLocationWithT(startLocation.y, directionVector.y, tValue),
                z: getLocationWithT(startLocation.z, directionVector.z, tValue),
            };
        }
    }
};

const addHitBlocks = (startLocation: Vector3, endLocation: Vector3, hitLocations: Vector3[]) => {
    const diffVector = getDiffVector(startLocation, endLocation);
    const totalDiff = sumVector(diffVector);

    // Diff 의 범위는 n 차원에서 0~n 이다
    if (totalDiff === 0) {
        return;
    } else if (totalDiff === 1) {
        hitLocations.push(endLocation);
    } else {
        const directionVector = {
            x: endLocation.x - startLocation.x,
            y: endLocation.y - startLocation.y,
            z: endLocation.z - startLocation.z,
        };

        if (totalDiff === 2) {
            const intersectionVector = getIntersectionVector(startLocation, directionVector, diffVector);
            hitLocations.push(intersectionVector);
        } else {
            // 일단 먼저 지나는 좌표를 찾아서 교점을 구하고, 해당 교점을 startLocation으로 하여 두번째 교점을 구해야 한다
            let secondIntersectionVector: Vector3 | null = null;
            let firstIntersectionVector = getIntersectionVector(
                startLocation,
                directionVector,
                {
                    ...diffVector,
                    z: 0,
                },
                true,
            );

            let sumValue = sumVector(getDiffVector(startLocation, firstIntersectionVector));
            if (sumValue !== 1) {
                if (sumValue === 2) {
                    secondIntersectionVector = firstIntersectionVector;
                }

                firstIntersectionVector = getIntersectionVector(
                    startLocation,
                    directionVector,
                    {
                        ...diffVector,
                        x: 0,
                    },
                    true,
                );

                sumValue = sumVector(getDiffVector(startLocation, firstIntersectionVector));
                if (sumValue !== 1) {
                    if (sumValue === 2) {
                        secondIntersectionVector = firstIntersectionVector;
                    }

                    firstIntersectionVector = getIntersectionVector(
                        startLocation,
                        directionVector,
                        {
                            ...diffVector,
                            y: 0,
                        },
                        true,
                    );
                }
            }

            if (!secondIntersectionVector) {
                secondIntersectionVector = getIntersectionVector(
                    firstIntersectionVector,
                    {
                        x: endLocation.x - firstIntersectionVector.x,
                        y: endLocation.y - firstIntersectionVector.y,
                        z: endLocation.z - firstIntersectionVector.z,
                    },
                    getDiffVector(firstIntersectionVector, endLocation),
                );
            }

            hitLocations.push(firstIntersectionVector, secondIntersectionVector);
        }
    }
};

export const getHitLocations = (startLocation: Vector3, endLocation: Vector3) => {
    const direction = {
        x: endLocation.x - startLocation.x,
        y: endLocation.y - startLocation.y,
        z: endLocation.z - startLocation.z,
    };

    /**
     * xyz 값이 각각 필요하므로 {@link getDistance} 함수 대신 직접 연산한다
     */
    const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    const pointCount = Math.floor(distance / POINT_GAP);

    const points = [startLocation];
    for (let i = 1; i <= pointCount; i++) {
        const multiplier = (i * POINT_GAP) / distance;
        points.push({
            x: startLocation.x + multiplier * direction.x,
            y: startLocation.y + multiplier * direction.y,
            z: startLocation.z + multiplier * direction.z,
        });
    }
    points.push(endLocation);

    const hitLocations = [startLocation];
    for (let i = 0; i <= pointCount; i++) {
        addHitBlocks(points[i], points[i + 1], hitLocations);
    }

    return hitLocations;
};
