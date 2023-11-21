import { Player } from "@minecraft/server";
import { Promisable } from "../type";
import { JobType } from "../data/jobData";

export default abstract class Job {
    constructor(public readonly jobType: JobType) {}

    abstract leftClick(player: Player): Promisable<unknown>;
}
