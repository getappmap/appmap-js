import { AppMap, Event } from '@appland/models';
import { verbose } from '../scanner/util';
import Assertion from '../assertion';
import { Finding, Scope } from '../types';

export default abstract class Strategy {
  protected abstract scope: Scope;
  protected abstract isEventApplicable(event: Event): boolean;

  supports(assertion: Assertion): boolean {
    return assertion.scope === this.scope;
  }

  check(appMap: AppMap, assertion: Assertion, findings: Finding[]): void {
    // TODO: strategy should be applied per request/command
    for (const e of appMap.events) {
      if (!e.isCall()) {
        continue;
      }
      if (verbose()) {
        console.warn(`Asserting ${assertion.id} on event ${e.toString()}`);
      }

      if (!e.returnEvent) {
        if (verbose()) {
          console.warn(`\tEvent has no returnEvent. Skipping.`);
        }
        continue;
      }
      if (!this.isEventApplicable(e)) {
        if (verbose()) {
          console.warn(`\tEvent is not applicable. Skipping.`);
        }
        continue;
      }

      if (assertion.where && !assertion.where(e, appMap)) {
        if (verbose()) {
          console.warn(`\t'where' clause is not satisifed. Skipping.`);
        }
        continue;
      }
      if (assertion.include.length > 0 && !assertion.include.every((fn) => fn(e, appMap))) {
        if (verbose()) {
          console.warn(`\t'include' clause is not satisifed. Skipping.`);
        }
        continue;
      }
      if (assertion.exclude.length > 0 && assertion.exclude.some((fn) => fn(e, appMap))) {
        if (verbose()) {
          console.warn(`\t'exclude' clause is not satisifed. Skipping.`);
        }
        continue;
      }

      const buildFinding = (): Finding => {
        return {
          appMapName: appMap.metadata.name,
          scannerId: assertion.id,
          scannerTitle: assertion.summaryTitle,
          event: e,
          message: null,
          condition: assertion.description || assertion.matcher.toString(),
        };
      };

      const matchResult = assertion.matcher(e, appMap);
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
}
