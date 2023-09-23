import { warn } from 'console';
import ChangeReport, { AppMap, FindingDiff, OpenAPIDiff, TestFailure } from './ChangeReport';
import { ExperimentalSection, Section } from './ReportSection';

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

class FindingDiffPreprocessor implements Preprocessor {
  constructor(public report: ChangeReport) {}

  get numElements(): number {
    return (
      this.report.findingDiff.newFindings.length + this.report.findingDiff.resolvedFindings.length
    );
  }

  prune(numElements: number) {
    const findingDiff = { ...this.report.findingDiff };

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
    case Section.Findings:
      return new FindingDiffPreprocessor(report);
    case Section.NewAppMaps:
      return new NewAppMapsPreprocessor(report);
    case ExperimentalSection.ChangedAppMaps:
      return new ChangedAppMapsPreprocessor(report);
    default:
      warn(`No Preprocessor for section ${section}`);
  }
}
