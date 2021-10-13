/** @internal */
export function numberToPixels(value: number) {
    return value.toString() + 'px';
}

/** @internal */
export function deepClone(object: Record<string, unknown>) {
    const result = clone(object);
    Object.keys(result).forEach(function(key) {
        const descriptor = Object.getOwnPropertyDescriptor(result, key);
        if (typeof descriptor.value === 'object') {
            result[key] = deepClone(descriptor.value);
        }
    });
    return result;
}

/** @internal */
function clone(value: unknown) {
    if (Array.isArray(value)) {
        return value.slice(); // clone array
    } else if (typeof value === 'object') {
        return Object.defineProperties({}, Object.getOwnPropertyDescriptors(value));
    } else {
        return value;
    }
}

/**
 * For each key in src:
 * * When `src[key]` is defined, assigns it to `object[key]` when the latter does not exist or is writable or is a setter
 * * When `src[key]` is undefined:
 *    * When `object[key]` is a configurable property and not an accessor, deletes it
 *    * Else when `object[key]` is writable or a setter, assigns `undefined` (setter handles deletion)
 * @param dest
 * @param src - Defined values set the corresponding key in `dest`. `undefined` values delete the key from `dest`.
 */
export function assignOrDelete(dest: Record<string, unknown>, src: Record<string, unknown>) {
    Object.keys(src).forEach(function(key) {
        let descriptor: PropertyDescriptor;
        for (let obj = dest; obj; obj = Object.getPrototypeOf(obj)) {
            if ((descriptor = Object.getOwnPropertyDescriptor(obj, key))) {
                break;
            }
        }

        if (src[key] !== undefined) {
            if (!descriptor || descriptor.writable || descriptor.set) {
                dest[key] = src[key];
            }
        } else if (descriptor) {
            if (descriptor.configurable && !descriptor.set && !descriptor.get) {
                delete dest[key];
            } else if (descriptor.writable || descriptor.set) {
                dest[key] = undefined;
            }
        } // else no descriptor so no property to delete
    });
}
