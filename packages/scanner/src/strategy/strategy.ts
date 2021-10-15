import { AppMap, Event } from '@appland/models';
import { verbose } from '../scanner/util';
import Assertion from '../assertion';
import { Finding, Scope, ScopedEvent } from '../types';

export default abstract class Strategy {
  protected abstract scope: Scope;
  protected abstract selectEvents(events: Generator<Event>): Generator<ScopedEvent>;

  supports(assertion: Assertion): boolean {
    return assertion.scope === this.scope;
  }

  check(appMap: AppMap, assertion: Assertion, findings: Finding[]): void {
    const eventGenerator = function* (): Generator<Event> {
      const { events } = appMap;
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        yield event;
      }
    };

    const events = this.selectEvents(eventGenerator());
    let scopedEvent = events.next();
    while (!scopedEvent.done) {
      const { event } = scopedEvent.value;
      if (verbose()) {
        console.warn(`Asserting ${assertion.id} on event ${event.toString()}`);
      }

      const shouldCheck = () => {
        if (!event.returnEvent) {
          if (verbose()) {
            console.warn(`\tEvent has no returnEvent. Skipping.`);
          }
          return false;
        }
        if (assertion.where && !assertion.where(event, appMap)) {
          if (verbose()) {
            console.warn(`\t'where' clause is not satisifed. Skipping.`);
          }
          return false;
        }
        if (assertion.include.length > 0 && !assertion.include.every((fn) => fn(event, appMap))) {
          if (verbose()) {
            console.warn(`\t'include' clause is not satisifed. Skipping.`);
          }
          return false;
        }
        if (assertion.exclude.length > 0 && assertion.exclude.some((fn) => fn(event, appMap))) {
          if (verbose()) {
            console.warn(`\t'exclude' clause is not satisifed. Skipping.`);
          }
          return false;
        }

        return true;
      };

      if (shouldCheck()) {
        this.collectFindings(appMap, scopedEvent.value, assertion, findings);
      }
      scopedEvent = events.next();
    }
  }

  collectFindings(
    appMap: AppMap,
    scopedEvent: ScopedEvent,
    assertion: Assertion,
    findings: Finding[]
  ): void {
    const { event, scopeId } = scopedEvent;

    const buildFinding = (): Finding => {
      return {
        appMapName: appMap.metadata.name,
        scannerId: assertion.id,
        scannerTitle: assertion.summaryTitle,
        event,
        message: null,
        condition: assertion.description || assertion.matcher.toString(),
      };
    };

    const matchResult = assertion.matcher(event, [appMap.name, scopeId].join(':'));
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
