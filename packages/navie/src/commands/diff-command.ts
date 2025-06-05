import Command, { CommandRequest } from '../command';
import { ProjectInfo } from '../project-info';
import ProjectInfoService from '../services/project-info-service';

// Define output formats: text, json, jsonl
export type DiffOutputFormat = 'text' | 'json' | 'jsonl';

export interface ProjectDiffInfo {
  directory: string;
  diff?: string;
}

// Transform ProjectInfo to ProjectDiffInfo
export function projectInfoToProjectDiffInfo(projectInfo: ProjectInfo): ProjectDiffInfo {
  return {
    directory: projectInfo.directory,
    diff: projectInfo.diff,
  };
}

export default class DiffCommand implements Command {
  constructor(private readonly projectInfoService: ProjectInfoService) {}

  async *execute(request: CommandRequest): AsyncIterable<string> {
    const outputFormat = request.userOptions.stringValue('format') || 'text';
    const baseBranch = request.userOptions.stringValue('base');

    const projectInfoResponse = await this.projectInfoService.lookupProjectInfo(true, baseBranch);
    const projectInfo = Array.isArray(projectInfoResponse)
      ? projectInfoResponse
      : [projectInfoResponse];

    if (outputFormat === 'text') {
      for (const info of projectInfo) {
        yield `Changes in ${info.directory}:\n`;
        yield info.diff || 'No changes detected.';
        yield '\n';
      }
    } else if (outputFormat === 'json') {
      yield JSON.stringify(projectInfo.map(projectInfoToProjectDiffInfo), null, 2);
    } else if (outputFormat === 'jsonl') {
      for (const info of projectInfo) {
        yield JSON.stringify(projectInfoToProjectDiffInfo(info)) + '\n';
      }
    }
  }
}
