import { ProjectInfo, ProjectInfoProvider, ProjectInfoResponse } from '../project-info';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';

type Test = () => boolean;

export default class ProjectInfoService {
  constructor(
    public interactionHistory: InteractionHistory,
    public projectInfoProvider: ProjectInfoProvider
  ) {}

  async lookupProjectInfo(): Promise<ProjectInfo[]> {
    const response = await this.projectInfoProvider({ type: 'projectInfo' });
    if (!response) {
      this.interactionHistory.log('No project info found');
      return [];
    }

    const projectInfo = Array.isArray(response) ? response : [response];
    this.interactionHistory.log('Project info obtained');

    const projectInfoKeys: [PromptType, keyof ProjectInfo, Test, string][] = [
      [
        PromptType.AppMapConfig,
        'appmapConfig',
        () => projectInfo.some(({ appmapConfig }) => Boolean(appmapConfig)),
        `The user's project does not contain an AppMap config file (appmap.yml).`,
      ],
      [
        PromptType.AppMapStats,
        'appmapStats',
        () => projectInfo.some(({ appmapStats }) => appmapStats.numAppMaps > 0),
        `The user's project does not contain any AppMaps.`,
      ],
    ];
    projectInfoKeys.forEach(([promptType, projectInfoKey, isPresent, missingInfoMessage]) => {
      if (!isPresent()) {
        this.interactionHistory.addEvent(
          new PromptInteractionEvent(promptType, 'system', missingInfoMessage)
        );
        return;
      }

      const promptValue = projectInfo.map((info) => {
        let value: Record<string, unknown> | undefined = info[projectInfoKey];
        const hasName = 'name' in info;
        if (!hasName && info.appmapConfig?.name) {
          value = { ...value, name: info.appmapConfig.name };
        }
        return value;
      });
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(promptType, 'system', buildPromptDescriptor(promptType))
      );
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          promptType,
          'user',
          buildPromptValue(promptType, JSON.stringify(promptValue))
        )
      );
    });

    return projectInfo;
  }
}
