export interface Breakpoint {
  condition: (counter: number, depth: number, eventName: string, ...args: unknown[]) => boolean;
}

export class BreakOnCounter implements Breakpoint {
  constructor(private readonly counter: number) {}

  condition(counter: number): boolean {
    return this.counter === counter;
  }

  toString(): string {
    return `(${this.counter})`;
  }
}

export class BreakOnEvent implements Breakpoint {
  constructor(private readonly eventName: string) {}

  condition(_counter: number, _depth: number, eventName: string): boolean {
    return this.eventName === eventName;
  }

  toString(): string {
    return this.eventName;
  }
}
