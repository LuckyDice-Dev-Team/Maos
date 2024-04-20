import { world } from "@minecraft/server";
import { opList } from "../system";
import AdminUI from "../ui/adminUI";
import { sendWarn } from "../utils/entityUtils";
import { setDebuff } from "../api/buffApi";
import { debuffPropertyValues } from "../data/propertyData";

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

            case "minecraft:ice": {
                setDebuff(source, debuffPropertyValues.pin, 50);
                return;
            }

            case "minecraft:blue_ice": {
                setDebuff(source, debuffPropertyValues.stun, 50);
                return;
            }

            default:
                return;
        }
    }
});
