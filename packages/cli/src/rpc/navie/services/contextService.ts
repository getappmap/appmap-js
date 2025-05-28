import { ContextV2, Help, ProjectInfo, TestInvocation } from '@appland/navie';
import { basename } from 'path';
import collectContext, { buildContextRequest } from '../../explain/collect-context';
import collectProjectInfos from '../../../cmds/navie/projectInfo';
import collectHelp from '../../../cmds/navie/help';
import detectCodeEditor from '../../../lib/detectCodeEditor';
import configuration from '../../configuration';
import { autoInjectable } from 'tsyringe';
import invokeTests from '../../../cmds/navie/invokeTests';
import getInvocationStrategy from '../../explain/invocation-strategy';

@autoInjectable()
export class ContextService {
  private readonly codeEditor?: string;

  constructor() {
    this.codeEditor = detectCodeEditor();
  }

  async searchContext(data: ContextV2.ContextRequest): Promise<ContextV2.ContextResponse> {
    const { vectorTerms, tokenCount, labels = [] } = data;
    const keywords = [...(vectorTerms || [])];
    const config = configuration();
    const appmapDirectories = await config
      .appmapDirectories()
      .then((dirs) => dirs.map((d) => d.directory));
    const projectDirectories = config.projectDirectories;

    if (keywords.length > 0) {
      if (
        labels.find(
          (label) =>
            (label.name === ContextV2.ContextLabelName.Architecture ||
              label.name === ContextV2.ContextLabelName.Overview) &&
            label.weight === ContextV2.ContextLabelWeight.High
        )
      ) {
        keywords.push('architecture', 'design', 'readme', 'about', 'overview');
        projectDirectories.forEach((dir) => keywords.push(basename(dir)));
      }
    }

    const charLimit = tokenCount * 3;
    const contextRequest = buildContextRequest(
      appmapDirectories,
      projectDirectories,
      undefined,
      keywords,
      charLimit,
      data
    );

    const searchResult = await collectContext(
      appmapDirectories,
      projectDirectories,
      charLimit,
      contextRequest.vectorTerms,
      contextRequest.request
    );

    return searchResult.context;
  }

  async projectInfoContext(
    data: ProjectInfo.ProjectInfoRequest
  ): Promise<ProjectInfo.ProjectInfoResponse> {
    return collectProjectInfos(this.codeEditor, data);
  }

  helpContext(data: Help.HelpRequest): Promise<Help.HelpResponse> {
    return collectHelp(data);
  }

  runTestContext(
    data: TestInvocation.TestInvocationRequest
  ): Promise<TestInvocation.TestInvocationResponse> {
    return invokeTests(getInvocationStrategy(), data);
  }
}
