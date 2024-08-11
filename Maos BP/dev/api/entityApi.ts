import { Entity, EntityQueryOptions, EntityRaycastOptions, Vector3 } from "@minecraft/server";
import { getTeam } from "./jobApi";
import { systemTagValues, teamTagValues } from "../data/tag";

export const getAllies = (entity: Entity, option: EntityQueryOptions, exceptSelf = false, location?: Vector3) => {
    const tags: string[] = [systemTagValues.game];
    const excludeTags: string[] = [];

    const team = getTeam(entity);
    if (team) {
        tags.push(team);
    } else {
        Object.values(teamTagValues).forEach((team) => excludeTags.push(team));
    }

    const allies = entity.dimension.getEntities({
        tags,
        excludeTags,
        location: location ?? entity.location,
        ...option,
    });

    if (exceptSelf) {
        allies.find((_entity, index) => allies.splice(index, 1));
    } else if (!allies.find((ally) => ally.id === entity.id)) {
        // 테스트용 주민과 같은 경우 없을 수 있으니 별도로 추가하자
        allies.push(entity);
    }

    return allies;
};

export const getEnemies = (entity: Entity, option: EntityQueryOptions, location?: Vector3) => {
    const excludeTags: string[] = [];
    const team = getTeam(entity);
    if (team) {
        excludeTags.push(team);
    }

    return entity.dimension.getEntities({
        excludeTags,
        tags: [systemTagValues.game],
        location: location ?? entity.location,
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
