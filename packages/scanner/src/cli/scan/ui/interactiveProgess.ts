/* eslint-disable prefer-rest-params */
import { AppMap, Event } from '@appland/models';
import EventEmitter from 'events';
import AppMapIndex from '../../../appMapIndex';
import Check from '../../../check';
import ProgressReporter from '../../../progressReporter';
import { MatchResult, ScopeName } from '../../../types';
import { Breakpoint, ExecutionContext } from '../breakpoint';

type ContextVariables = {
  event?: Event;
  matchResult?: string | boolean | MatchResult[];
};

export default class InteractiveProgress extends EventEmitter implements ProgressReporter {
  breakpoints: Breakpoint[] = [];

  depth = 0;
  counter = 0;

  appMap?: AppMap;
  appMapFileName?: string;
  check?: Check;
  scope?: Event;
  event?: Event;

  breakpointResolver?: () => void;

  constructor() {
    super();

    this.initialize();
  }

  initialize(): void {
    this.depth = 0;
    this.counter = 0;
  }

  addBreakpoint(breakpoint: Breakpoint): void {
    this.breakpoints.push(breakpoint);
  }

  removeBreakpoint(breakpoint: Breakpoint): void {
    this.breakpoints = this.breakpoints.filter((b) => b !== breakpoint);
  }

  get prefix(): string {
    const counterStr = `(${this.counter}) `;
    return (
      counterStr + '  '.repeat(this.depth).padStart(10 + this.depth * 2 - counterStr.length, ' ')
    );
  }

  resume(): void {
    if (!this.breakpointResolver) return;

    this.breakpointResolver();
    this.breakpointResolver = undefined;
  }

  async breakOn(eventName: string, variables: ContextVariables): Promise<void> {
    const context = {
      eventName,
      appMap: this.appMap,
      appMapFileName: this.appMapFileName,
      check: this.check,
      scope: this.scope,
      counter: this.counter,
      depth: this.depth,
      ...variables,
    } as ExecutionContext;
    const hitBreakpoint = this.breakpoints.find((b) => b.condition(context));
    if (!hitBreakpoint) return;

    this.emit('breakpoint', hitBreakpoint, context);

    return new Promise<void>((resolve) => {
      this.breakpointResolver = resolve;
    });
  }

  async beginAppMap(appMapFileName: string, appMap: AppMap): Promise<void> {
    console.log(`${this.prefix}beginAppMap: ${appMapFileName}`);
    this.depth += 1;
    this.appMapFileName = appMapFileName;
    this.appMap = appMap;
    await this.breakOn('beginAppMap', {});
    this.counter += 1;
  }
  async beginCheck(check: Check): Promise<void> {
    console.log(`${this.prefix}beginCheck: ${check}`);
    this.depth += 1;
    this.check = check;
    await this.breakOn('beginCheck', {});
    this.counter += 1;
  }
  async filterScope(scopeName: ScopeName, scope: Event): Promise<void> {
    console.log(`${this.prefix}filterScope: ${scopeName} ${scope}`);
    await this.breakOn('filterScope', {});
    this.counter += 1;
  }
  async enterScope(scope: Event): Promise<void> {
    console.log(`${this.prefix}enterScope: ${scope}`);
    this.depth += 1;
    this.scope = scope;
    await this.breakOn('enterScope', {});
    this.counter += 1;
  }
  async filterEvent(event: Event): Promise<void> {
    console.log(`${this.prefix}filterEvent: ${event}`);
    this.event = event;
    await this.breakOn('filterEvent', { event });
    this.event = undefined;
    this.counter += 1;
  }
  async matchResult(
    event: Event,
    matchResult: string | boolean | MatchResult[] | undefined
  ): Promise<void> {
    console.log(`${this.prefix}matchResult: ${matchResult}`);
    this.event = event;
    await this.breakOn('matchResult', { matchResult });
    this.event = undefined;
    this.counter += 1;
  }
  async matchEvent(event: Event, _appMapIndex: AppMapIndex): Promise<void> {
    console.log(`${this.prefix}matchEvent: ${event}`);
    this.event = event;
    await this.breakOn('matchEvent', {});
    this.event = undefined;
    this.counter += 1;
  }
  async leaveScope(): Promise<void> {
    this.depth -= 1;
    console.log(`${this.prefix}leaveScope`);
    await this.breakOn('leaveScope', {});
    this.scope = undefined;
    this.counter += 1;
  }
  async endCheck(): Promise<void> {
    this.depth -= 1;
    console.log(`${this.prefix}endCheck`);
    await this.breakOn('endCheck', {});
    this.check = undefined;
    this.counter += 1;
  }
  async endAppMap(): Promise<void> {
    this.depth -= 1;
    console.log(`${this.prefix}endAppMap`);
    await this.breakOn('endAppMap', {});
    this.appMap = undefined;
    this.appMapFileName = undefined;
    this.counter += 1;
  }
}
