export declare const createIdGenerator: () => (prefix: string) => string;
export declare const isDefined: <T>(value: T) => value is NonNullable<T>;
/**
 * Check if two rectangles (e.g. an element and the capture area) intersect.
 */
export declare const doRectanglesIntersect: (a: DOMRectReadOnly, b: DOMRectReadOnly) => boolean;
/**
 * Calculates the length of the diagonale of a given rectangle.
 */
export declare function diagonale(box: DOMRectReadOnly): number;
export declare function withTimeout<T>(timeout: number, message: string, func: () => Promise<T>): Promise<T>;
/**
 * Type guard to check if an object is a specific member of a tagged union type.
 *
 * @param key The key to check
 * @param value The value the key has to be.
 */
export declare const isTaggedUnionMember: <T extends object, K extends keyof T, V extends T[K]>(key: K, value: V) => (object: T) => object is T & Record<K, V>;
export declare function assert(condition: any, message: string): asserts condition;
//# sourceMappingURL=util.d.ts.map