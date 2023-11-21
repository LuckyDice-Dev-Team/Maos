import { Player, system } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, FormResponse, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { Promisable } from "../type";

export default abstract class UI {
    protected cancelReason?: string;
    protected error: unknown;

    public constructor(protected player: Player, protected retryOnBusy = true, protected retryOnCancel = false) {}

    protected abstract createForm(): null | MessageFormData | ActionFormData | ModalFormData;
    protected abstract processResult(result: FormResponse): Promisable<unknown>;

    getCanceled() {
        return this.cancelReason ?? this.getError();
    }

    getError() {
        return this.error;
    }

    isCustomWarn() {
        return (
            this.cancelReason &&
            !this.getError() &&
            this.cancelReason !== FormCancelationReason.UserBusy &&
            this.cancelReason !== FormCancelationReason.UserClosed
        );
    }

    async show(ui?: UI) {
        this.cancelReason = undefined;
        this.error = undefined;

        try {
            try {
                const form = this.createForm();
                if (!form) {
                    return;
                }

                const formResult = await form.show(this.player);
                const { canceled, cancelationReason } = formResult;

                if (canceled) {
                    if (cancelationReason) {
                        this.cancelReason = cancelationReason;
                        return;
                    }

                    if (
                        (this.retryOnBusy && cancelationReason === FormCancelationReason.UserBusy) ||
                        (this.retryOnCancel && cancelationReason === FormCancelationReason.UserClosed)
                    ) {
                        let promiseResolve: (value: unknown) => void;
                        let promiseReject: (reason?: unknown) => void;
                        const promise = new Promise((resolve, reject) => {
                            promiseResolve = resolve;
                            promiseReject = reject;
                        });

                        system.runTimeout(() => {
                            this.show().then(promiseResolve).catch(promiseReject);
                        }, 20);

                        await promise;
                    }
                } else {
                    await this.processResult(formResult);
                }
            } catch (error) {
                this.error = error;
                console.error(error);

                return;
            }
        } finally {
            if (ui) {
                ui.cancelReason = this.cancelReason;
                ui.error = this.error;
            }
        }
    }
}
