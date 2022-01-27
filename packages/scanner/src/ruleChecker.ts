import { AppMap, Event } from '@appland/models';
import Check from './check';
import { AbortError } from './errors';
import { Finding } from './types';
import { verbose } from './rules/lib/util';
import ScopeIterator from './scope/scopeIterator';
import RootScope from './scope/rootScope';
import HTTPServerRequestScope from './scope/httpServerRequestScope';
import HTTPClientRequestScope from './scope/httpClientRequestScope';
import CommandScope from './scope/commandScope';
import SQLTransactionScope from './scope/sqlTransactionScope';
import CheckInstance from './checkInstance';

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
    appMap: AppMap,
    check: Check,
    findings: Finding[]
  ): Promise<void> {
    if (verbose()) {
      console.warn(`Checking AppMap ${appMap.name} with scope ${check.scope}`);
    }
    const scopeIterator = this.scopes[check.scope];
    if (!scopeIterator) {
      throw new AbortError(`Invalid scope name "${check.scope}"`);
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
      const checkInstance = new CheckInstance(check);
      if (!check.filterScope(scope.scope, appMap)) {
        continue;
      }
      if (checkInstance.enumerateScope) {
        for (const event of scope.events()) {
          await this.checkEvent(event, scope.scope, appMapFile, appMap, checkInstance, findings);
        }
      } else {
        await this.checkEvent(
          scope.scope,
          scope.scope,
          appMapFile,
          appMap,
          checkInstance,
          findings
        );
      }
    }
  }

  async checkEvent(
    event: Event,
    scope: Event,
    appMapFile: string,
    appMap: AppMap,
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

    if (!checkInstance.filterEvent(event, appMap)) {
      return;
    }

    const buildFinding = (
      matchEvent: Event | undefined = undefined,
      message: string | undefined = undefined,
      groupMessage: string | undefined = undefined,
      occurranceCount: number | undefined = undefined,
      relatedEvents: Event[] | undefined = undefined
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
      return {
        appMapFile,
        checkId: checkInstance.checkId,
        ruleId: checkInstance.ruleId,
        ruleTitle: checkInstance.title,
        event: findingEvent,
        hash: findingEvent.hash,
        stack,
        scope,
        message: message || checkInstance.title,
        groupMessage,
        occurranceCount,
        relatedEvents,
      } as Finding;
    };

    const matchResult = await checkInstance.ruleLogic.matcher(
      event,
      appMap,
      checkInstance.filterEvent.bind(checkInstance)
    );
    const numFindings = findings.length;
    if (matchResult === true) {
      let finding;
      if (checkInstance.ruleLogic.message) {
        const message = checkInstance.ruleLogic.message(scope, event);
        finding = buildFinding(event, message);
      } else {
        finding = buildFinding(event);
      }
      findings.push(finding);
    } else if (typeof matchResult === 'string') {
      const finding = buildFinding(event, matchResult as string);
      finding.message = matchResult as string;
      findings.push(finding);
    } else if (matchResult) {
      matchResult.forEach((mr) => {
        const finding = buildFinding(
          mr.event,
          mr.message,
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
