declare module 'sinon/lib/sinon/util/core/extend' {
  export default function extend(target: unknown, ...sources: unknown[]): unknown;
  export function nonEnum(target: unknown, ...sources: unknown[]): unknown;
}
