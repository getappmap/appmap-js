import { ProjectInfoProvider, ProjectInfoResponse } from '../project-info';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';
import { PromptType, buildPromptDescriptor, buildPromptValue } from '../prompt';

type Test = () => boolean;

type EmptyMap = Record<string, never>;

export default class ProjectInfoService {
  constructor(
    public interactionHistory: InteractionHistory,
    public projectInfoProvider: ProjectInfoProvider
  ) {}

  async lookupProjectInfo(): Promise<ProjectInfoResponse | EmptyMap> {
    const projectInfo = await this.projectInfoProvider({ type: 'projectInfo' });
    if (!projectInfo) {
      this.interactionHistory.log('No project info found');
      return {};
    }

    this.interactionHistory.log('Project info obtained');
    const projectInfoKeys: [PromptType, keyof ProjectInfoResponse, Test, string][] = [
      [
        PromptType.AppMapConfig,
        'appmapConfig',
        () => !!projectInfo.appmapConfig?.appmap_dir,
        `The user's project does not contain an AppMap config file (appmap.yml).`,
      ],
      [
        PromptType.AppMapStats,
        'appmapStats',
        () => projectInfo.appmapStats?.numAppMaps > 0,
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

      const promptValue = projectInfo[projectInfoKey];
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
