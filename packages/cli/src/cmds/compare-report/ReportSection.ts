import { SafeString } from 'handlebars';
import { join } from 'path';

import ChangeReport, { AppMap } from './ChangeReport';
import assert from 'assert';
import buildPreprocessor, { filterFindings } from './Preprocessor';
import helpers from '../../report/helpers';
import urlHelpers from '../../report/urlHelpers';
import compileTemplate from '../../report/compileTemplate';

export const DEFAULT_MAX_ELEMENTS = 10;

export enum Section {
  FailedTests = 'failed-tests',
  OpenAPIDiff = 'openapi-diff',
  SecurityFlaws = 'security-flaws',
  PerformanceProblems = 'performance-problems',
  CodeAntiPatterns = 'code-antipatterns',
  NewAppMaps = 'new-appmaps',
  RemovedAppMaps = 'removed-appmaps',
}

export const FindingsSections: (Section | ExperimentalSection)[] = [
  Section.SecurityFlaws,
  Section.PerformanceProblems,
  Section.CodeAntiPatterns,
];

export enum ExperimentalSection {
  SQLDiff = 'sql-diff',
  ChangedAppMaps = 'changed-appmaps',
}

export type SectionMetadata = {
  name: string;
  title: string;
  anchor: string;
  emoji: string;
};

type ReportContext = ChangeReport & { metadata?: SectionMetadata };

const SECTION_DIRECTORY: Record<Section & ExperimentalSection, string> = {
  'performance-problems': 'findings',
  'security-flaws': 'findings',
  'code-antipatterns': 'findings',
};

const SECTION_METADATA: Record<Section & ExperimentalSection, SectionMetadata> = {
  'performance-problems': {
    name: 'performance problems',
    title: 'Performance problems',
    anchor: 'performance-problems',
    emoji: '🐌',
  },
  'security-flaws': {
    name: 'security flaws',
    title: 'Security flaws',
    anchor: 'security-flaws',
    emoji: '🔒',
  },
  'code-antipatterns': {
    name: 'code anti-patterns',
    title: 'Code anti-patterns',
    anchor: 'code-antipatterns',
    emoji: '🚨',
  },
};

export type ReportOptions = {
  appmapURL?: string;
  sourceURL?: string;
  maxElements?: number;
  baseDir?: string;
  metadata?: SectionMetadata;
};

export default class ReportSection {
  constructor(
    public section: Section | ExperimentalSection,
    private headingTemplate: HandlebarsTemplateDelegate,
    private detailsTemplate: HandlebarsTemplateDelegate
  ) {}

  generateHeading(changeReport: ChangeReport) {
    return this.headingTemplate(this.buildContext(changeReport), {
      helpers: { ...helpers, ...ReportSection.helpers() },
    });
  }

  generateDetails(changeReport: ChangeReport, options: ReportOptions) {
    const report: ChangeReport = { ...changeReport };

    let maxElements = options.maxElements || DEFAULT_MAX_ELEMENTS;
    const preprocessor = buildPreprocessor(this.section, report);
    if (preprocessor) {
      const { numElements } = preprocessor;
      if (numElements > maxElements) {
        const pruneResult = preprocessor.prune(maxElements);
        for (const key of Object.keys(pruneResult)) {
          report[key] = pruneResult[key];
        }
        report.pruned = true;
      }
    }

    return this.detailsTemplate(this.buildContext(report), {
      helpers: { ...helpers, ...ReportSection.helpers(), ...urlHelpers(options) },
      allowProtoPropertiesByDefault: true,
    });
  }

  buildContext(changeReport: ChangeReport): ReportContext {
    const context = { ...changeReport } as any;
    const metadata = SECTION_METADATA[this.section];
    if (metadata) context.metadata = metadata;

    if (changeReport.findingDiff && FindingsSections.includes(this.section)) {
      const newFindings = filterFindings(changeReport.findingDiff.newFindings, this.section);
      const resolvedFindings = filterFindings(
        changeReport.findingDiff.resolvedFindings,
        this.section
      );
      context.findingDiff = { newFindings, resolvedFindings };
    }

    return context;
  }

  static helpers() {
    type RecorderGroup = {
      recorderName: string;
      count: number;
      isTest: boolean;
    };

    const group_appmaps_by_recorder_name = (appmaps: AppMap[]): RecorderGroup[] => {
      const recorderGroups = appmaps.reduce((acc, appmap) => {
        const recorderName = appmap.recorderName || 'unknown';
        if (!acc.has(recorderName))
          acc.set(recorderName, {
            recorderName: recorderName,
            isTest: appmap.isTest,
            count: 1,
          });
        else acc.get(recorderName)!.count += 1;
        return acc;
      }, new Map<string, RecorderGroup>());
      return [...recorderGroups.values()].sort((a, b) => b.count - a.count);
    };

    const appmap_title = (appmap: AppMap): string => {
      const tokens: string[] = [];
      if (appmap.recorderName) tokens.push(['[', appmap.recorderName, ']'].join(''));
      tokens.push(appmap.displayName);
      return tokens.join(' ');
    };

    const section_link = (sectionName: string, anchor: string, itemCount: number): SafeString =>
      new SafeString(itemCount === 0 ? sectionName : `[${sectionName}](#${anchor})`);

    return {
      appmap_title,
      group_appmaps_by_recorder_name,
      section_link,
    };
  }

  static async build(
    section: Section | ExperimentalSection,
    templateDir = '../../resources/compare-report'
  ): Promise<ReportSection> {
    assert(templateDir);

    const sectionDir = SECTION_DIRECTORY[section] || section;

    const headingTemplateFile = (await import(
      join(templateDir, sectionDir, 'heading.hbs')
    )) as string;
    if (!headingTemplateFile) {
      throw new Error(`Heading template not found for section: ${section}`);
    }

    const detailsTemplateFile = (await import(
      join(templateDir, sectionDir, 'details.hbs')
    )) as string;
    if (!detailsTemplateFile) {
      throw new Error(`Details template not found for section: ${section}`);
    }

    const headingTemplate = compileTemplate(headingTemplateFile);
    const detailsTemplate = compileTemplate(detailsTemplateFile);

    return new ReportSection(section, headingTemplate, detailsTemplate);
  }
}
