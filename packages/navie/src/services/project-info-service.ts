import { dump } from 'js-yaml';
import { ProjectInfo, ProjectInfoProvider } from '../project-info';
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
    return projectInfo;
  }

  promptProjectInfo(isArchitecture: boolean, projectInfo: ProjectInfo[]) {
    const emitProjectInfo: ProjectInfo[] = projectInfo.map((info) => ({ ...info }));

    if (!isArchitecture) {
      for (const info of emitProjectInfo) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete (info as any).appmapStats;
      }
    }

    const projectInfoKeys: [
      PromptType,
      'appmapConfig' | 'appmapStats' | 'codeEditor',
      Test,
      string
    ][] = [
      [
        PromptType.AppMapConfig,
        'appmapConfig',
        () => projectInfo.some(({ appmapConfig }) => Boolean(appmapConfig)),
        `The project does not contain an AppMap config file (appmap.yml).`,
      ],
      [
        PromptType.AppMapStats,
        'appmapStats',
        () =>
          projectInfo.some(
            ({ appmapStats }) => appmapStats?.numAppMaps && appmapStats.numAppMaps > 0
          ),
        `The project does not contain any AppMaps.`,
      ],
      [
        PromptType.CodeEditor,
        'codeEditor',
        () => projectInfo.some(({ codeEditor }) => Boolean(codeEditor)),
        `The code editor is not specified.`,
      ],
    ];
    projectInfoKeys.forEach(([promptType, projectInfoKey, isPresent, missingInfoMessage]) => {
      if (!isPresent()) {
        this.interactionHistory.addEvent(
          new PromptInteractionEvent(promptType, 'user', missingInfoMessage)
        );
        return;
      }

      const promptValue = projectInfo.map((info) => info[projectInfoKey]).filter(Boolean);

      this.interactionHistory.addEvent(
        new PromptInteractionEvent(promptType, 'system', buildPromptDescriptor(promptType))
      );
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          promptType,
          'user',
          buildPromptValue(promptType, dump(promptValue))
        )
      );
    });
  }
}
