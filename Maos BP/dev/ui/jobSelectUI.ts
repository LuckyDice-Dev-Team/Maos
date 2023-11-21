import UI from "./ui";
import { jobDataValues, JobType } from "../data/jobData";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { keys } from "../utils/objectUtils";

export default class JobSelectUI extends UI {
    public jobType?: JobType;
    private jobTypeMap: Map<number, JobType> = new Map();

    createForm() {
        const form = new ActionFormData().title("직업 선택");
        const jobTypes = keys(jobDataValues);

        this.jobTypeMap.clear();
        for (let i = 0; i < jobTypes.length; i++) {
            const jobType = jobTypes[i];

            this.jobTypeMap.set(i, jobType);
            form.button(jobType);
        }

        return form;
    }

    processResult(result: ActionFormResponse) {
        this.jobType = this.jobTypeMap.get(result.selection!);
    }
}
