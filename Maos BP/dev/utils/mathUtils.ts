import { Vector3 } from "@minecraft/server";
import { Space } from "../space/space";

/**
 * start-end 선분과 target 의 수선의 발을 구하는 코드
 */
export const getPerpendicularFoot = (startLocation: Vector3, endLocation: Vector3, targetLocation: Vector3): Vector3 => {
    // start - end 방향 벡터
    const vector1 = Space.subtract(endLocation, startLocation);
    const vector1Sqrt = Space.multiply(vector1, vector1);

    // target - start 방향 벡터
    const vector2 = Space.subtract(targetLocation, startLocation);

    const tangentParam = Space.multiply(vector1, vector2).sum() / vector1Sqrt.sum();
    return Space.add(startLocation, Space.multiply(vector1, tangentParam));
};

/**
 * start-end 선분과 target 이 중점인 반지름 r 원에서 start 좌표와 가장 가까운 접점을 구하는 코드
 * @return null 알맞은 지점을 찾을 수 없을 시
 */
export const getClosestMatchPoint = (startLocation: Vector3, endLocation: Vector3, targetLocation: Vector3, r: number): Vector3 | null => {
    // start - end 방향 벡터
    const vector1 = Space.subtract(endLocation, startLocation);

    // start - target 방향 벡터
    const vector2 = Space.subtract(startLocation, targetLocation);

    // 선분과 원의 방정식을 연립하여 근을 찾음
    const a = Space.multiply(vector1, vector1).sum();
    const b = 2 * Space.multiply(vector1, vector2).sum();
    const c = Space.multiply(vector2, vector2).sum() - r ** 2;

    // 근의 공식 사용
    const discriminant = b ** 2 - 4 * a * c;
    if (discriminant < 0) {
        return null;
    }

    // 두 접점 계산
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const tangentParams = [(-b + sqrtDiscriminant) / (2 * a), (-b - sqrtDiscriminant) / (2 * a)];
    const matchPoints = tangentParams.map((tangentParam) => Space.add(startLocation, Space.multiply(vector1, tangentParam)));

    // startLocation 과 가장 가까운 접점 찾기
    const dis1 = Space.distance(startLocation, matchPoints[0]);
    const dis2 = Space.distance(startLocation, matchPoints[1]);

    if (dis1 < dis2) {
        return matchPoints[0];
    } else {
        return matchPoints[1];
    }
};
