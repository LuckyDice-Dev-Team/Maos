import { world } from "@minecraft/server";
import { opList } from "../system";
import AdminUI from "../ui/adminUI";
import { sendWarn } from "../utils/entityUtils";

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (opList.includes(source.name)) {
        switch (itemStack.typeId) {
            case "minecraft:compass": {
                const adminUI = new AdminUI(source);
                adminUI
                    .show()
                    .then(() => {
                        if (adminUI.isCustomWarn()) {
                            sendWarn(source, adminUI.getCanceled());
                        }
                    })
                    .catch(console.error);

                return;
            }

            default:
                return;
        }
    }
});
