import UI from "./ui";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";

export default class InputUI extends UI {
    public input?: string;

    createForm() {
        return new ModalFormData().title("값 입력").textField("값", "입력해주세요");
    }

    processResult({ formValues }: ModalFormResponse) {
        this.input = formValues?.[0] as string | undefined;
        if (this.input === "undefined") {
            this.input = undefined;
        }
    }
}
