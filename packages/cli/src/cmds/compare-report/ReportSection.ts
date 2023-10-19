import Handlebars, { SafeString } from 'handlebars';
import { isAbsolute, join, relative } from 'path';

import { readFile } from 'fs/promises';
import ChangeReport, { AppMap, FindingDiff } from './ChangeReport';
import { existsSync } from 'fs';
import assert from 'assert';
import { RevisionName } from '../../diffArchive/RevisionName';
import buildPreprocessor, { filterFindings } from './Preprocessor';
import helpers from './helpers';

export const TemplateDirectory = [
  '../../../resources/change-report', // As packaged
  '../../../../resources/change-report', // In development
]
  .map((dirName) => join(__dirname, dirName))
  .find((dirName) => existsSync(dirName));
assert(TemplateDirectory, "Report template directory 'change-report' not found");

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
  sourceURL: URL;
  appmapURL: URL;
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

  generateHeading(changeReport: ChangeReport, options: ReportOptions) {
    return this.headingTemplate(this.buildContext(changeReport), {
      helpers: ReportSection.helpers(options),
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
      helpers: ReportSection.helpers(options),
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

  static helpers(options: ReportOptions): { [name: string]: Function } | undefined {
    let { baseDir } = options;
    if (!baseDir) baseDir = process.cwd();

    const source_url = (location: string, fileLinenoSeparator = '#L') => {
      if (typeof fileLinenoSeparator === 'object') {
        fileLinenoSeparator = '#L';
      }

      const [path, lineno] = location.split(':');

      if (isAbsolute(path)) return;
      if (path.startsWith('vendor/') || path.startsWith('node_modules/')) return;

      if (options.sourceURL) {
        const url = new URL(options.sourceURL.toString());
        if (url.protocol === 'file:') {
          assert(baseDir);
          const sourcePath = relative(baseDir, join(url.pathname, path));
          return new Handlebars.SafeString(
            [sourcePath, lineno].filter(Boolean).join(fileLinenoSeparator)
          );
        } else {
          url.pathname = join(url.pathname, path);
          if (lineno) url.hash = `L${lineno}`;
          return new Handlebars.SafeString(url.toString());
        }
      } else {
        return new Handlebars.SafeString(location);
      }
    };

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

    const appmap_url = (revisionName: RevisionName, appmap: AppMap) => {
      let { id } = appmap;
      const path = [revisionName, `${id}.appmap.json`].join('/');

      if (options.appmapURL) {
        const url = new URL(options.appmapURL.toString());
        url.searchParams.append('path', path);
        return new Handlebars.SafeString(url.toString());
      } else {
        return new Handlebars.SafeString(path);
      }
    };

    const appmap_diff_url = (appmap: AppMap): SafeString => {
      const path = ['diff', `${appmap.id}.diff.sequence.json`].join('/');

      if (options.appmapURL) {
        const url = new URL(options.appmapURL.toString());
        url.searchParams.append('path', path);
        return new Handlebars.SafeString(url.toString());
      } else {
        return new Handlebars.SafeString(path);
      }
    };

    const source_link = (location: string, fileLinenoSeparator = '#L'): SafeString => {
      const label = location;
      const url = source_url(location, fileLinenoSeparator);
      return url
        ? new SafeString(`<a href="${url}"><code>${label}</code></a>`)
        : new SafeString(label);
    };

    const section_link = (sectionName: string, anchor: string, itemCount: number): SafeString =>
      new SafeString(itemCount === 0 ? sectionName : `[${sectionName}](#${anchor})`);

    return {
      appmap_diff_url,
      appmap_title,
      appmap_url,
      group_appmaps_by_recorder_name,
      section_link,
      source_link,
      source_url,
      ...helpers,
    };
  }

  static async build(
    section: Section | ExperimentalSection,
    templateDir = TemplateDirectory
  ): Promise<ReportSection> {
    assert(templateDir);

    const sectionDir = SECTION_DIRECTORY[section] || section;

    const headingTemplateFile = join(templateDir, sectionDir, 'heading.hbs');
    const headingTemplate = Handlebars.compile(await readFile(headingTemplateFile, 'utf8'));

    const detailsTemplateFile = join(templateDir, sectionDir, 'details.hbs');
    const detailsTemplate = Handlebars.compile(await readFile(detailsTemplateFile, 'utf8'));

    return new ReportSection(section, headingTemplate, detailsTemplate);
  }
}
