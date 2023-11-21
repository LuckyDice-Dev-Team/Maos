import Job from "../../type/jobType";
import { Player } from "@minecraft/server";
import { Promisable } from "../../type";
import { spawnProjectile } from "../../api/projectileApi";
import { getProjectileData } from "../projectileData";

export default class IceMagician extends Job {
    leftClick(player: Player): Promisable<unknown> {
        spawnProjectile(player, getProjectileData(this.jobType, 1));
        return;
    }
}
