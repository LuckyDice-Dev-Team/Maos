import { Dimension, MolangVariableMap, Vector3 } from "@minecraft/server";

export const trySpawnParticle = (dimension: Dimension, effectName: string, location: Vector3, molangVariables?: MolangVariableMap) => {
    try {
        dimension.spawnParticle(effectName, location, molangVariables);
    } catch {
        // DO NOTHING
    }
};
