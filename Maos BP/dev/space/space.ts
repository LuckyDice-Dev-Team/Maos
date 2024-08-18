import { Dimension, Vector2, Vector3 } from "@minecraft/server";

export class Space {
    public x: number;
    public y: number;
    public z: number;

    constructor(vec: Space | Vector3) {
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
    }

    public static add(a: Vector3 | Space, b: Vector3 | Space) {
        return Space.getByValue(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    public static subtract(a: Vector3 | Space, b: Vector3 | Space) {
        return Space.getByValue(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    public static cross(a: Vector3, b: Vector3) {
        return Space.getByValue(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }

    public static distance(a: Vector3, b: Vector3) {
        return Space.getByValue(a.x - b.x, a.y - b.y, a.z - b.z).len();
    }

    public static divide(a: Vector3, b: number | Vector3) {
        if (typeof b == "number") {
            return Space.getByValue(a.x / b, a.y / b, a.z / b);
        }

        return Space.getByValue(a.x / b.x, a.y / b.y, a.z / b.z);
    }

    public static multiply(a: Vector3, b: number | Vector3) {
        if (typeof b == "number") {
            return Space.getByValue(a.x * b, a.y * b, a.z * b);
        }

        return Space.getByValue(a.x * b.x, a.y * b.y, a.z * b.z);
    }

    public static getByValue(x: number, y: number, z: number) {
        return new Space({ x, y, z });
    }

    public static getByVector(vec: Space | Vector3) {
        return new Space(vec);
    }

    public static len(vector: Vector3) {
        return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
    }

    public static sum(vector: Vector3) {
        return vector.x + vector.y + vector.z;
    }

    public clone() {
        return new Space(this);
    }

    public verify(dimension: Dimension) {
        try {
            return dimension.getBlock(this) !== undefined;
        } catch (e) {
            return false;
        }
    }

    /**
     * 현재 Space의 영점으로 부터의 거리를 반환합니다.
     */
    public len() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    public sum() {
        return this.x + this.y + this.z;
    }

    /**
     * x축을 기준으로 rad만큼 회전시킵니다. rad는 60진법이 아닌 라디안 값입니다.
     * (z축이 앞, x축은 왼 쪽입니다.)
     */
    public xTilt(rad: number) {
        const y = this.y * Math.cos(rad) - this.z * Math.sin(rad);
        const z = this.y * Math.sin(rad) + this.z * Math.cos(rad);

        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * y축을 기준으로 rad만큼 회전시킵니다. rad는 60진법이 아닌 라디안 값입니다.
     * (z축이 앞, x축은 왼 쪽입니다.)
     */
    public yTilt(rad: number) {
        const x = this.z * Math.sin(rad) + this.x * Math.cos(rad);
        const z = this.z * Math.cos(rad) - this.x * Math.sin(rad);

        this.x = x;
        this.z = z;
        return this;
    }

    /**
     * z축을 기준으로 rad만큼 회전시킵니다. rad는 60진법이 아닌 라디안 값입니다.
     * (z축이 앞, x축은 왼 쪽입니다.)
     */
    public zTilt(rad: number) {
        const y = this.x * Math.sin(rad) + this.y * Math.cos(rad);
        const x = this.x * Math.cos(rad) - this.y * Math.sin(rad);

        this.y = y;
        this.x = x;
        return this;
    }

    /**
     * 주어진 벡터가 공간의 기준 벡터가 되도록 좌표를 수정합니다.
     */
    public tiltByView(viewVec3: Vector3) {
        const viewVec = Space.getByValue(viewVec3.x, viewVec3.y, viewVec3.z);

        // rotated basis
        const xVec = viewVec.normalized();
        const zVec = Space.cross(xVec, { x: 0, y: 1, z: 0 }).normalized();
        const yVec = Space.cross(xVec, zVec).normalized();

        // representing vector with new basis
        const xComponent = Space.multiply(xVec, { x: this.x, y: this.x, z: this.x });
        const zComponent = Space.multiply(zVec, { x: this.z, y: this.z, z: this.z });
        const yComponent = Space.multiply(yVec, { x: -this.y, y: -this.y, z: -this.y });

        const vec = Space.add(xComponent, Space.add(yComponent, zComponent));

        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;

        return this;
    }

    public toVector3(): Vector3 {
        return { x: this.x, y: this.y, z: this.z };
    }

    /**
     * num만큼 x, y, z에 곱합니다.
     */
    public multiply(num: number) {
        this.x *= num;
        this.y *= num;
        this.z *= num;

        return this;
    }

    /**
     * 주어진 벡터만큼 현재 Space를 변화시킵니다.
     */
    public add(vec: Space | Vector3) {
        this.x += vec.x;
        this.y += vec.y;
        this.z += vec.z;

        return this;
    }

    /**
     * 주어진 벡터의 역만큼 현재 Space를 변화시킵니다.
     */
    public subtract(vec: Space | Vector3) {
        this.x -= vec.x;
        this.y -= vec.y;
        this.z -= vec.z;

        return this;
    }

    /**
     * 현재 Space를 길이가 1이 되도록 normalize합니다.
     */
    public normalized() {
        const length = this.len();
        if (length == 0) {
            return this;
        }

        this.x = this.x / length;
        this.y = this.y / length;
        this.z = this.z / length;

        return this;
    }

    /**
     * 현재 좌표를 위쪽 방향으로 이동시킵니다.
     */
    public up(num: number = 1) {
        this.y += num;
        return this;
    }

    /**
     * @returns {Vector2} x: pitch, y: yaw
     */
    public toYawPitch(): Vector2 {
        const tmp = this.clone().normalized();
        const xzDist = Space.getByValue(tmp.x, 0, tmp.z).len();
        const yaw = ((Math.acos(tmp.z / xzDist) * 180) / Math.PI) * (tmp.x < 0 ? 1 : -1);
        const pitch = -(Math.atan(tmp.y / xzDist) * 180) / Math.PI;

        return { x: Math.floor(pitch * 100) / 100, y: Math.floor(yaw * 100) / 100 };
    }
}
