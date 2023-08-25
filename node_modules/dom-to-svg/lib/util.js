export const createIdGenerator = () => {
    const nextCounts = new Map();
    return prefix => {
        var _a;
        const count = (_a = nextCounts.get(prefix)) !== null && _a !== void 0 ? _a : 1;
        nextCounts.set(prefix, count + 1);
        return `${prefix}${count}`;
    };
};
export const isDefined = (value) => value !== null && value !== undefined;
/**
 * Check if two rectangles (e.g. an element and the capture area) intersect.
 */
export const doRectanglesIntersect = (a, b) => !(a.bottom < b.top || // A is above B
    a.top > b.bottom || // A is below B
    a.right < b.left || // A is left of B
    // A is right of B
    a.left > b.right);
/**
 * Calculates the length of the diagonale of a given rectangle.
 */
export function diagonale(box) {
    return Math.sqrt(box.width ** 2 + box.height ** 2);
}
export function withTimeout(timeout, message, func) {
    return Promise.race([
        func(),
        new Promise((resolve, reject) => setTimeout(() => reject(new Error(message)), timeout)),
    ]);
}
/**
 * Type guard to check if an object is a specific member of a tagged union type.
 *
 * @param key The key to check
 * @param value The value the key has to be.
 */
export const isTaggedUnionMember = (key, value) => (object) => object[key] === value;
export function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
//# sourceMappingURL=util.js.map