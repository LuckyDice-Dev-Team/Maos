export const convertListToObject = <K extends string>(list: readonly K[]) => {
    const obj: Record<string, string> = {};
    for (const str of list) {
        obj[str] = str;
    }

    type T = (typeof list)[number];
    return obj as Record<T, T>;
};

export const keys = <K extends string | number | symbol>(record: Record<K, unknown>) => {
    return Object.keys(record) as K[];
};
