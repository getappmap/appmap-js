import { AppMap, Event } from '@appland/models';
import Assertion from './assertion';
import { AbortError } from './errors';
import { AssertionPrototype, Finding } from './types';
import { verbose } from './scanner/util';
import ScopeIterator from './scope/scopeIterator';
import RootScope from './scope/rootScope';
import HTTPServerRequestScope from './scope/httpServerRequestScope';
import HTTPClientRequestScope from './scope/httpClientRequestScope';
import CommandScope from './scope/commandScope';

export default class AssertionChecker {
  private scopes: Record<string, ScopeIterator> = {
    root: new RootScope(),
    command: new CommandScope(),
    http_server_request: new HTTPServerRequestScope(),
    http_client_request: new HTTPClientRequestScope(),
  };

  async check(
    appMap: AppMap,
    assertionPrototype: AssertionPrototype,
    matches: Finding[]
  ): Promise<void> {
    if (verbose()) {
      console.warn(`Checking AppMap ${appMap.name} with scope ${assertionPrototype.scope}`);
    }
    const scopeIterator = this.scopes[assertionPrototype.scope];
    if (!scopeIterator) {
      throw new AbortError(`Invalid scope name "${assertionPrototype.scope}"`);
    }

    const callEvents = function* (): Generator<Event> {
      for (let i = 0; i < appMap.events.length; i++) {
        yield appMap.events[i];
      }
    };

    for (const scope of scopeIterator.scopes(callEvents())) {
      if (verbose()) {
        console.warn(`Scope ${scope.scope}`);
      }
      const assertion = assertionPrototype.build();
      if (assertionPrototype.enumerateScope) {
        for (const event of scope.events()) {
          await this.checkEvent(event, scope.scope, appMap, assertion, matches);
        }
      } else {
        await this.checkEvent(scope.scope, scope.scope, appMap, assertion, matches);
      }
    }
  }

  async checkEvent(
    event: Event,
    scope: Event,
    appMap: AppMap,
    assertion: Assertion,
    findings: Finding[]
  ): Promise<void> {
    if (!event.isCall()) {
      return;
    }
    if (verbose()) {
      console.warn(
        `Asserting ${assertion.id} on ${event.codeObject.fqid} event ${event.toString()}`
      );
    }

    if (event.codeObject.fqid === 'function:app/controllers/SessionsController#create') {
      1 === 1;
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

    const buildFinding = (
      matchEvent: Event | undefined = undefined,
      message: string | undefined = undefined,
      relatedEvents: Event[] | undefined = undefined
    ): Finding => {
      const findingEvent = matchEvent || event;
      return {
        appMapName: appMap.metadata.name,
        scannerId: assertion.id,
        scannerTitle: assertion.summaryTitle,
        event: findingEvent,
        hash: findingEvent.hash,
        scope,
        message,
        relatedEvents,
        condition: assertion.description || assertion.matcher.toString(),
      };
    };

    const matchResult = await assertion.matcher(event, appMap);
    const numFindings = findings.length;
    if (matchResult === true) {
      findings.push(buildFinding(event));
    } else if (typeof matchResult === 'string') {
      const finding = buildFinding(event, matchResult as string);
      finding.message = matchResult as string;
      findings.push(finding);
    } else if (matchResult) {
      matchResult.forEach((mr) => {
        const finding = buildFinding(mr.event, mr.message, mr.relatedEvents);
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
