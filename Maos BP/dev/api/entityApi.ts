import { Entity, EntityQueryOptions, EntityRaycastOptions } from "@minecraft/server";
import { getTeam } from "./jobApi";
import { systemTagValues } from "../data/tag";

export const getAllies = (entity: Entity, option: EntityQueryOptions) => {
    const tags: string[] = [systemTagValues.game];
    const team = getTeam(entity);
    if (team) {
        tags.push(team);
    }

    return entity.dimension.getEntities({
        tags,
        location: entity.location,
        ...option,
    });
};

export const getEnemies = (entity: Entity, option: EntityQueryOptions) => {
    const excludeTags: string[] = [];
    const team = getTeam(entity);
    if (team) {
        excludeTags.push(team);
    }

    return entity.dimension.getEntities({
        excludeTags,
        tags: [systemTagValues.game],
        location: entity.location,
        ...option,
    });
};

export const getEnemiesFromViewDirection = (entity: Entity, option: EntityRaycastOptions) => {
    const teamTag = getTeam(entity);
    return entity
        .getEntitiesFromViewDirection(option)
        .filter(({ entity }) => entity.hasTag(systemTagValues.game) && (!teamTag || !entity.hasTag(teamTag)))
        .sort((a, b) => a.distance - b.distance);
};
