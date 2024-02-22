import { ProjectInfoProvider, ProjectInfoResponse } from '../project-info';
import InteractionHistory, { PromptInteractionEvent } from '../interaction-history';

export default class ProjectInfoService {
  constructor(
    public interactionHistory: InteractionHistory,
    public projectInfoProvider: ProjectInfoProvider
  ) {}

  async lookupProjectInfo(): Promise<ProjectInfoResponse | undefined> {
    const projectInfo = await this.projectInfoProvider({});
    if (projectInfo) {
      this.interactionHistory.log('Project info obtained');
      this.interactionHistory.addEvent(
        new PromptInteractionEvent(
          'projectInfo',
          false,
          JSON.stringify(projectInfo),
          'Project information: '
        )
      );
    } else {
      this.interactionHistory.log('No project info could be obtained');
    }
    return projectInfo;
  }
}
