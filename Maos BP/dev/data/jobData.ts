import { convertListToObject } from "../utils/objectUtils";
import Job from "../type/jobType";
import IceMagician from "./job/iceMagician";
import Archer from "./job/archer";

const jobDatas = ["ice_magician", "archer"] as const;
export type JobType = (typeof jobDatas)[number];
export const jobDataValues = convertListToObject(jobDatas);

export const jobs: Record<JobType, Job> = {
    ice_magician: new IceMagician("ice_magician"),
    archer: new Archer("archer"),
};
