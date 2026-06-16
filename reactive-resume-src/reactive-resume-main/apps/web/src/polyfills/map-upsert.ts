declare global {
	interface Map<K, V> {
		getOrInsert(key: K, value: V): V;
		getOrInsertComputed(key: K, callbackFn: (key: K) => V): V;
	}
}

const defineMapMethod = <T extends keyof Map<unknown, unknown>>(name: T, value: Map<unknown, unknown>[T]) => {
	if (typeof Map.prototype[name] === "function") return;

	Object.defineProperty(Map.prototype, name, {
		value,
		writable: true,
		configurable: true,
	});
};

const canonicalizeKeyedCollectionKey = <K>(key: K): K => {
	return Object.is(key, -0) ? (0 as K) : key;
};

defineMapMethod("getOrInsert", function getOrInsert<K, V>(this: Map<K, V>, key: K, value: V): V {
	const canonicalKey = canonicalizeKeyedCollectionKey(key);

	if (this.has(canonicalKey)) return this.get(canonicalKey) as V;

	this.set(canonicalKey, value);

	return value;
});

defineMapMethod("getOrInsertComputed", function getOrInsertComputed<
	K,
	V,
>(this: Map<K, V>, key: K, callbackFn: (key: K) => V): V {
	if (typeof callbackFn !== "function")
		throw new TypeError("Map.prototype.getOrInsertComputed callback must be a function");

	const canonicalKey = canonicalizeKeyedCollectionKey(key);

	if (this.has(canonicalKey)) return this.get(canonicalKey) as V;

	const value = callbackFn(canonicalKey);
	this.set(canonicalKey, value);

	return value;
});

export {};
