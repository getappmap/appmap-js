export type TypeDifference<A, B> = Exclude<A, B> | Exclude<B, A>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertNever<T extends never>() {}
