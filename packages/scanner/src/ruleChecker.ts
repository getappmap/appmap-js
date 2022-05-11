import { Event } from '@appland/models';
import Check from './check';
import { AbortError } from './errors';
import { AppMapIndex, Finding, ScopeName } from './types';
import { verbose } from './rules/lib/util';
import ScopeIterator from './scope/scopeIterator';
import RootScope from './scope/rootScope';
import HTTPServerRequestScope from './scope/httpServerRequestScope';
import HTTPClientRequestScope from './scope/httpClientRequestScope';
import CommandScope from './scope/commandScope';
import SQLTransactionScope from './scope/sqlTransactionScope';
import CheckInstance from './checkInstance';
import { createHash } from 'crypto';
import { cloneEvent } from './eventUtil';

export default class RuleChecker {
  private scopes: Record<string, ScopeIterator> = {
    root: new RootScope(),
    command: new CommandScope(),
    http_server_request: new HTTPServerRequestScope(),
    http_client_request: new HTTPClientRequestScope(),
    transaction: new SQLTransactionScope(),
  };

  async check(
    appMapFile: string,
    appMapIndex: AppMapIndex,
    check: Check,
    findings: Finding[]
  ): Promise<void> {
    const numScopesChecked = await this.checkScope(
      appMapFile,
      appMapIndex,
      check,
      check.scope,
      findings
    );
    if (numScopesChecked === 0 && check.scope === 'command') {
      await this.checkScope(appMapFile, appMapIndex, check, 'root', findings);
    }
  }

  async checkScope(
    appMapFile: string,
    appMapIndex: AppMapIndex,
    check: Check,
    scope: ScopeName,
    findings: Finding[]
  ): Promise<number> {
    if (verbose()) {
      console.warn(`Checking AppMap ${appMapIndex.appMap.name} with scope ${scope}`);
    }
    const scopeIterator = this.scopes[scope];
    if (!scopeIterator) {
      throw new AbortError(`Invalid scope name "${scope}"`);
    }

    const callEvents = function* (): Generator<Event> {
      const events = appMapIndex.appMap.events;
      for (let i = 0; i < events.length; i++) {
        yield events[i];
      }
    };

    let numScopes = 0;
    for (const scope of scopeIterator.scopes(callEvents())) {
      numScopes += 1;
      if (verbose()) {
        console.warn(`Scope ${scope.scope}`);
      }
      const checkInstance = new CheckInstance(check);
      if (!check.filterScope(scope.scope, appMapIndex)) {
        continue;
      }
      if (checkInstance.enumerateScope) {
        for (const event of scope.events()) {
          await this.checkEvent(
            event,
            scope.scope,
            appMapFile,
            appMapIndex,
            checkInstance,
            findings
          );
        }
      } else {
        await this.checkEvent(
          scope.scope,
          scope.scope,
          appMapFile,
          appMapIndex,
          checkInstance,
          findings
        );
      }
    }
    return numScopes;
  }

  async checkEvent(
    event: Event,
    scope: Event,
    appMapFile: string,
    appMapIndex: AppMapIndex,
    checkInstance: CheckInstance,
    findings: Finding[]
  ): Promise<void> {
    if (!event.isCall()) {
      return;
    }
    if (verbose()) {
      console.warn(
        `Asserting ${checkInstance.ruleId} on ${event.codeObject.fqid} event ${event.toString()}`
      );
    }

    if (!event.returnEvent) {
      if (verbose()) {
        console.warn(`\tEvent has no returnEvent. Skipping.`);
      }
      return;
    }

    if (!checkInstance.filterEvent(event, appMapIndex)) {
      return;
    }

    const buildFinding = (
      matchEvent: Event,
      participatingEvents: Record<string, Event>,
      volatileData: Record<string, string | number>,
      message?: string,
      description?: string,
      groupMessage?: string,
      occurranceCount?: number,
      // matchEvent will be added to additionalEvents and participatingEvents.values
      // to create the relatedEvents array
      additionalEvents?: Event[]
    ): Finding => {
      const findingEvent = matchEvent || event;
      // Fixes:
      // TypeError: Cannot read property 'forEach' of undefined
      //   at hashHttp (/Users/kgilpin/source/appland/scanner/node_modules/@appland/models/dist/index.cjs:1663:11)
      //   at hashEvent (/Users/kgilpin/source/appland/scanner/node_modules/@appland/models/dist/index.cjs:1714:14)
      //   at Event.get hash [as hash] (/Users/kgilpin/source/appland/scanner/node_modules/@appland/models/dist/index.cjs:3325:27)
      findingEvent.message ||= [];
      const stack: string[] = [
        findingEvent.codeObject.location,
        ...findingEvent.ancestors().map((ancestor) => ancestor.codeObject.location),
      ].filter(Boolean);

      const uniqueEvents = new Set<number>();
      const relatedEvents: Array<Event> = [];

      function addRelatedEvent(event: Event): void {
        if (uniqueEvents.has(event.id)) {
          return;
        }
        uniqueEvents.add(event.id);
        relatedEvents.push(cloneEvent(event));
      }

      addRelatedEvent(findingEvent);
      (additionalEvents || []).forEach(addRelatedEvent);

      // Update event hash with unique hashes of related events.
      // Preserve the finding hash for now, by not including participatingEvents values.
      // This maintains backwards compatibility while we rethink the hash algorithm.
      const hashV1 = createHash('sha256');
      {
        hashV1.update(findingEvent.hash);
        hashV1.update(checkInstance.ruleId);
        [...new Set(relatedEvents.map((e) => e.hash))].sort().forEach((eventHash) => {
          hashV1.update(eventHash);
        });
      }

      Object.values(participatingEvents).forEach(addRelatedEvent);

      return {
        appMapFile,
        checkId: checkInstance.checkId,
        ruleId: checkInstance.ruleId,
        ruleTitle: checkInstance.title,
        event: cloneEvent(findingEvent),
        hash: hashV1.digest('hex'),
        stack,
        scope: cloneEvent(scope),
        message: message || checkInstance.title,
        groupMessage,
        occurranceCount,
        relatedEvents: relatedEvents.sort((event) => event.id),
        impactDomain: checkInstance.checkImpactDomain,
        description,
        participatingEvents: Object.fromEntries(
          Object.entries(participatingEvents).map(([k, v]) => [k, cloneEvent(v)])
        ),
        volatileData,
      } as Finding;
    };

    const matchResult = await checkInstance.ruleLogic.matcher(
      event,
      appMapIndex,
      checkInstance.filterEvent.bind(checkInstance)
    );
    const numFindings = findings.length;
    if (matchResult === true) {
      let finding;
      if (checkInstance.ruleLogic.message) {
        const message = checkInstance.ruleLogic.message(scope, event);
        finding = buildFinding(event, {}, {}, message);
      } else {
        finding = buildFinding(event, {}, {});
      }
      findings.push(finding);
    } else if (typeof matchResult === 'string') {
      const finding = buildFinding(event, {}, {}, matchResult as string);
      finding.message = matchResult as string;
      findings.push(finding);
    } else if (matchResult) {
      matchResult.forEach((mr) => {
        const finding = buildFinding(
          mr.event,
          mr.participatingEvents || {},
          mr.volatileData || {},
          mr.message,
          mr.description,
          mr.groupMessage,
          mr.occurranceCount,
          mr.relatedEvents
        );
        findings.push(finding);
      });
    }
    if (verbose()) {
      if (findings.length > numFindings) {
        findings.forEach((finding) =>
          console.log(`\tFinding: ${finding.ruleId} : ${finding.message}`)
        );
      }
    }
  }
}
