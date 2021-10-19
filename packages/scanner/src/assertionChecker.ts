import { AppMap, Event } from '@appland/models';
import Assertion from './assertion';
import { AbortError } from './errors';
import { AssertionPrototype, Finding, Scope } from './types';
import { verbose } from './scanner/util';
import ScopeIterator from './scope/scopeIterator';
import RootScope from './scope/rootScope';
import HTTPServerRequestScope from './scope/httpServerRequestScope';
import CommandScope from './scope/commandScope';
import AllScope from './scope/allScope';

export default class AssertionChecker {
  private scopes: Record<string, ScopeIterator> = {
    all: new AllScope(),
    root: new RootScope(),
    command: new CommandScope(),
    http_server_request: new HTTPServerRequestScope(),
  };

  check(appMap: AppMap, assertionPrototype: AssertionPrototype, matches: Finding[]): void {
    if (verbose()) {
      console.warn(`Checking AppMap ${appMap.name}`);
    }
    const scopeIterator = this.scopes[assertionPrototype.scope];
    if (!scopeIterator) {
      throw new AbortError(`Invalid scope name "${assertionPrototype.scope}"`);
    }

    const callEvents = function* (): Generator<Event> {
      for (let i = 0; i < appMap.events.length; i++) {
        const event = appMap.events[i];
        if (event.isCall()) {
          yield event;
        }
      }
    };

    for (const scope of scopeIterator.scopes(callEvents())) {
      const assertion = assertionPrototype.build();
      this.checkScope(scope, appMap, assertion, matches);
    }
  }

  checkScope(scope: Scope, appMap: AppMap, assertion: Assertion, matches: Finding[]): void {
    for (const event of scope.events()) {
      this.checkEvent(event, scope.scope, appMap, assertion, matches);
    }
  }

  checkEvent(
    event: Event,
    scope: Event,
    appMap: AppMap,
    assertion: Assertion,
    findings: Finding[]
  ): void {
    if (!event.isCall()) {
      return;
    }
    if (verbose()) {
      console.warn(`Asserting ${assertion.id} on event ${event.toString()}`);
    }

    if (!event.returnEvent) {
      if (verbose()) {
        console.warn(`\tEvent has no returnEvent. Skipping.`);
      }
      return;
    }

    if (assertion.where && !assertion.where(event, appMap)) {
      if (verbose()) {
        console.warn(`\t'where' clause is not satisifed. Skipping.`);
      }
      return;
    }
    if (assertion.include.length > 0 && !assertion.include.every((fn) => fn(event, appMap))) {
      if (verbose()) {
        console.warn(`\t'include' clause is not satisifed. Skipping.`);
      }
      return;
    }
    if (assertion.exclude.length > 0 && assertion.exclude.some((fn) => fn(event, appMap))) {
      if (verbose()) {
        console.warn(`\t'exclude' clause is not satisifed. Skipping.`);
      }
      return;
    }

    const buildFinding = (): Finding => {
      return {
        appMapName: appMap.metadata.name,
        scannerId: assertion.id,
        scannerTitle: assertion.summaryTitle,
        event,
        scope,
        message: null,
        condition: assertion.description || assertion.matcher.toString(),
      };
    };

    const matchResult = assertion.matcher(event);
    const numFindings = findings.length;
    if (matchResult === true) {
      findings.push(buildFinding());
    } else if (typeof matchResult === 'string') {
      const finding = buildFinding();
      finding.message = matchResult as string;
      findings.push(finding);
    } else if (matchResult) {
      matchResult.forEach((mr) => {
        const finding = buildFinding();
        if (mr.message) {
          finding.message = mr.message;
        }
        findings.push(finding);
      });
    }
    if (verbose()) {
      if (findings.length > numFindings) {
        findings.forEach((finding) =>
          console.log(`\tFinding: ${finding.scannerId} : ${finding.message || finding.condition}`)
        );
      }
    }
  }
}
