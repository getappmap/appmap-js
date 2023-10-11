import { warn } from 'console';
import ChangeReport, { FindingChange } from './ChangeReport';
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

  prune(numElements: number) {
    return { testFailures: this.report.testFailures.slice(0, numElements) };
  }
}

class OpenAPIDiffPreprocessor implements Preprocessor {
  constructor(public report: ChangeReport) {}

  get numElements(): number {
    return this.report.openapiDiff.differenceCount;
  }

  prune(numElements: number) {
    const openapiDiff = { ...this.report.openapiDiff };

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

  constructor(public report: ChangeReport, public section: Section) {
    this.newFindings = filterFindings(this.report.findingDiff.newFindings || [], section);
    this.resolvedFindings = filterFindings(this.report.findingDiff.resolvedFindings || [], section);
  }

  get numElements(): number {
    return this.newFindings.length + this.resolvedFindings.length;
  }

  prune(numElements: number) {
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

  prune(numElements: number) {
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

  prune(numElements: number) {
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

  prune(numElements: number) {
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
      return new OpenAPIDiffPreprocessor(report);
    case Section.SecurityFlaws:
    case Section.CodeAntiPatterns:
    case Section.PerformanceProblems:
      return new FindingDiffPreprocessor(report, section);
    case Section.NewAppMaps:
      return new NewAppMapsPreprocessor(report);
    case Section.RemovedAppMaps:
      return new RemovedAppMapsPreprocessor(report);
    case ExperimentalSection.ChangedAppMaps:
      return new ChangedAppMapsPreprocessor(report);
    default:
      warn(`No Preprocessor for section ${section}`);
  }
}
