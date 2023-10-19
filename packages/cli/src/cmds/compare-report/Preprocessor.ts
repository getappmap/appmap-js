import { warn } from 'console';
import ChangeReport, {
  AppMap,
  FindingChange,
  FindingDiff,
  OpenAPIDiff,
  SQLDiff,
  TestFailure,
} from './ChangeReport';
import { ExperimentalSection, Section } from './ReportSection';
import { ImpactDomain } from '@appland/scanner';

export interface Preprocessor {
  get numElements(): number;

  prune(numElements: number): any;
}

class FailedTestsPreprocessor implements Preprocessor {
  constructor(public report: ChangeReport) {}

  get numElements(): number {
    return this.report.testFailures.length;
  }

  prune(numElements: number): { testFailures: TestFailure[] } {
    return { testFailures: this.report.testFailures.slice(0, numElements) };
  }
}

class OpenAPIDiffPreprocessor implements Preprocessor {
  constructor(public openapiDiff: OpenAPIDiff) {}

  get numElements(): number {
    return this.openapiDiff.differenceCount;
  }

  prune(numElements: number): { openapiDiff: OpenAPIDiff } {
    const openapiDiff = { ...this.openapiDiff };

    let numRemaining = numElements;
    {
      numRemaining -= openapiDiff.breakingDifferences.length;
      openapiDiff.breakingDifferences = openapiDiff.breakingDifferences.slice(0, numElements);
    }

    if (numRemaining > 0) {
      numRemaining -= openapiDiff.nonBreakingDifferences.length;
      openapiDiff.nonBreakingDifferences = openapiDiff.nonBreakingDifferences.slice(0, numElements);
    } else {
      openapiDiff.nonBreakingDifferences = [];
    }

    if (numRemaining > 0) {
      numRemaining -= openapiDiff.unclassifiedDifferences.length;
      openapiDiff.unclassifiedDifferences = openapiDiff.unclassifiedDifferences.slice(
        0,
        numElements
      );
    } else {
      openapiDiff.unclassifiedDifferences = [];
    }

    return { openapiDiff };
  }
}

class SQLDiffPreprocessor implements Preprocessor {
  constructor(public sqlDiff: SQLDiff) {}

  get numElements(): number {
    return (
      this.sqlDiff.newQueries.length +
      this.sqlDiff.removedQueries.length +
      this.sqlDiff.newTables.length +
      this.sqlDiff.removedTables.length
    );
  }

  prune(numElements: number): { sqlDiff: SQLDiff } {
    const sqlDiff = { ...this.sqlDiff };

    const keys = ['newQueries', 'removedQueries', 'newTables', 'removedTables'];
    for (const key of keys) {
      let numRemaining = numElements;
      if (numRemaining > 0) {
        numRemaining -= sqlDiff[key].length;
        sqlDiff[key] = sqlDiff[key].slice(0, numElements);
      } else {
        sqlDiff[key] = [];
      }
    }
    return { sqlDiff };
  }
}

const SECTION_INCLUDE_DOMAINS: Record<Section & ExperimentalSection, ImpactDomain[]> = {
  'performance-problems': ['Performance'],
  'security-flaws': ['Security'],
};

const SECTION_EXCLUDE_DOMAINS: Record<Section & ExperimentalSection, ImpactDomain[]> = {
  'code-antipatterns': ['Security', 'Performance'],
};

export function filterFindings(findings: FindingChange[], section: Section | ExperimentalSection) {
  const includeDomains = SECTION_INCLUDE_DOMAINS[section];
  const excludeDomains = SECTION_EXCLUDE_DOMAINS[section];

  return findings.filter(
    (finding) =>
      (!includeDomains || includeDomains.includes(finding.finding.impactDomain || 'Stability')) &&
      (!excludeDomains || !excludeDomains.includes(finding.finding.impactDomain || 'Stability'))
  );
}

class FindingDiffPreprocessor implements Preprocessor {
  newFindings: FindingChange[];
  resolvedFindings: FindingChange[];

  constructor(public findingDiff: FindingDiff, public section: Section) {
    this.newFindings = filterFindings(this.findingDiff.newFindings || [], section);
    this.resolvedFindings = filterFindings(this.findingDiff.resolvedFindings || [], section);
  }

  get numElements(): number {
    return this.newFindings.length + this.resolvedFindings.length;
  }

  prune(numElements: number): { findingDiff: FindingDiff } {
    const findingDiff = { newFindings: this.newFindings, resolvedFindings: this.resolvedFindings };

    let numRemaining = numElements;
    {
      numRemaining -= findingDiff.newFindings.length;
      findingDiff.newFindings = findingDiff.newFindings.slice(0, numElements);
    }

    if (numRemaining > 0) {
      numRemaining -= findingDiff.resolvedFindings.length;
      findingDiff.resolvedFindings = findingDiff.resolvedFindings.slice(0, numElements);
    } else {
      findingDiff.resolvedFindings = [];
    }

    return { findingDiff };
  }
}

class NewAppMapsPreprocessor implements Preprocessor {
  constructor(public report: ChangeReport) {}

  get numElements() {
    return this.report.newAppMaps.length;
  }

  prune(numElements: number): { newAppMaps: AppMap[] } {
    return {
      newAppMaps: this.report.newAppMaps.slice(0, numElements),
    };
  }
}

class RemovedAppMapsPreprocessor implements Preprocessor {
  constructor(public report: ChangeReport) {}

  get numElements() {
    return this.report.removedAppMaps.length;
  }

  prune(numElements: number): { removedAppMaps: AppMap[] } {
    return {
      removedAppMaps: this.report.removedAppMaps.slice(0, numElements),
    };
  }
}

class ChangedAppMapsPreprocessor implements Preprocessor {
  constructor(public report: ChangeReport) {}

  get numElements() {
    return Object.keys(this.report.changedAppMaps).length;
  }

  prune(numElements: number): { changedAppMaps: Record<string, AppMap[]> } {
    const retainKeys = Object.keys(this.report.changedAppMaps).slice(0, numElements);
    return {
      changedAppMaps: retainKeys.reduce(
        (memo, key) => ((memo[key] = this.report.changedAppMaps[key]), memo),
        {}
      ),
    };
  }
}

export default function buildPreprocessor(
  section: Section | ExperimentalSection,
  report: ChangeReport
): Preprocessor | undefined {
  switch (section) {
    case Section.FailedTests:
      return new FailedTestsPreprocessor(report);
    case Section.OpenAPIDiff:
      return report.openapiDiff ? new OpenAPIDiffPreprocessor(report.openapiDiff) : undefined;
    case Section.SecurityFlaws:
    case Section.CodeAntiPatterns:
    case Section.PerformanceProblems:
      return report.findingDiff
        ? new FindingDiffPreprocessor(report.findingDiff, section)
        : undefined;
    case Section.NewAppMaps:
      return new NewAppMapsPreprocessor(report);
    case Section.RemovedAppMaps:
      return new RemovedAppMapsPreprocessor(report);
    case ExperimentalSection.ChangedAppMaps:
      return new ChangedAppMapsPreprocessor(report);
    case ExperimentalSection.SQLDiff:
      return report.sqlDiff ? new SQLDiffPreprocessor(report.sqlDiff) : undefined;
    default:
      warn(`No Preprocessor for section ${section}`);
  }
}
