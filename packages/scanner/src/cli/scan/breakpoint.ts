import { AppMap } from '@appland/client';
import { Event } from '@appland/models';
import Check from '../../check';
import { MatchResult } from '../../types';

export type ExecutionContext = {
  counter: number;
  depth: number;
  eventName: string;
  appMap?: AppMap;
  appMapFileName?: string;
  check?: Check;
  event?: Event;
  matchResult?: string | boolean | MatchResult[];
};

export interface Breakpoint {
  condition: (context: ExecutionContext) => boolean;
}

export class BreakOnCounter implements Breakpoint {
  constructor(private readonly counter: number) {}

  condition(context: ExecutionContext): boolean {
    return this.counter === context.counter;
  }

  toString(): string {
    return `(${this.counter})`;
  }
}

export class BreakOnEvent implements Breakpoint {
  eventName: RegExp;

  constructor(eventName: string) {
    this.eventName = makeRegularExpression(eventName);
  }

  condition(context: ExecutionContext): boolean {
    return this.eventName.test(context.eventName);
  }

  toString(): string {
    return this.eventName.toString();
  }
}

export class BreakOnLabel implements Breakpoint {
  label: RegExp;

  constructor(label: string) {
    this.label = makeRegularExpression(label);
  }

  condition(context: ExecutionContext): boolean {
    if (!context.event) return false;

    return !![...context.event.codeObject.labels].find((label) => this.label.test(label));
  }

  toString(): string {
    return this.label.toString();
  }
}

export class BreakOnCodeObject implements Breakpoint {
  codeObject: RegExp;

  constructor(codeObject: string) {
    this.codeObject = makeRegularExpression(codeObject);
  }

  condition(context: ExecutionContext): boolean {
    if (!context.event) return false;

    return this.codeObject.test(context.event.codeObject.fqid);
  }

  toString(): string {
    return this.codeObject.toString();
  }
}

function escapeRegexp(expr: string): RegExp {
  return new RegExp(expr.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
}

function makeRegularExpression(expr: string): RegExp {
  if (expr.length < 2) return escapeRegexp(expr);

  if (expr.startsWith('/') && expr.endsWith('/')) return new RegExp(expr);

  return escapeRegexp(expr);
}
