

/**
 * @class
 */
// rename to Factory
export class Registry<T> {
    private readonly items = new Map<string, T>();

    get all() { return this.items.values; }

    /**
     * @summary Register an item and return it.
     * @desc Adds an item to the registry using the provided name (or the class name), converted to all lower case.
     * @param {string} [name] - Case-insensitive item key. If not given, fallsback to `item.prototype.$$CLASS_NAME` or `item.prototype.name` or `item.name`.
     * @param [item] - If unregistered or omitted, nothing is added and method returns `undefined`.
     *
     * > Note: `$$CLASS_NAME` is normally set by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|extend} call.
     *
     * @returns Newly registered item or `undefined` if unregistered.
     */
    register(name: string, item: T) {
        this.items.set(name, item);
        return item;
    }

    get(name: string): T | undefined {
        if (!name) {
            return undefined;
        } else {
            const result = this.items.get(name); // for performance reasons, do not convert to lower case
            return result;
        }
    }
}
