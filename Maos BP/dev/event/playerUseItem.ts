import { world } from "@minecraft/server";
import { opList } from "../system";
import AdminUI from "../ui/adminUI";
import { sendWarn } from "../utils/entityUtils";
import { applyDebuff } from "../api/buffApi";
import { debuffPropertyValues } from "../data/propertyData";

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (opList.includes(source.name)) {
        switch (itemStack.typeId) {
            case "minecraft:compass": {
                if (source.isSneaking) {
                    const [target] = source.getEntitiesFromViewDirection({
                        maxDistance: 16,
                    });
                    source.sendMessage(String(target?.entity?.nameTag));
                } else {
                    const adminUI = new AdminUI(source);
                    adminUI
                        .show()
                        .then(() => {
                            if (adminUI.isCustomWarn()) {
                                sendWarn(source, adminUI.getCanceled());
                            }
                        })
                        .catch(console.error);
                }

                return;
            }

            case "minecraft:ice": {
                applyDebuff(source, debuffPropertyValues.pin, 50);
                return;
            }

            case "minecraft:blue_ice": {
                applyDebuff(source, debuffPropertyValues.stun, 50);
                return;
            }

            default:
                return;
        }
    }
});
