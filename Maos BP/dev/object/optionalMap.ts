export default class OptionalMap<K, V> extends Map<K, V> {
    getOrThrow(key: K) {
        const value = this.get(key);
        if (value === undefined || value === null) {
            throw new Error(`Value of ${key} is ${value}`);
        }

        return value;
    }

    getOrDefault(key: K, value: V) {
        return this.get(key) ?? value;
    }
}
