import ProjectInfoService from '../../src/services/project-info-service';
import InteractionHistory from '../../src/interaction-history';
import { ProjectInfo, ProjectInfoProvider } from '../../src/project-info';
import { PromptType } from '../../src/prompt';
import { jest } from '@jest/globals';

describe('ProjectInfoService', () => {
  let interactionHistory: InteractionHistory;
  let projectInfoProviderFn: jest.Mock<ProjectInfoProvider>;
  let service: ProjectInfoService;

  beforeEach(() => {
    interactionHistory = new InteractionHistory();
    interactionHistory.on('event', (event) => console.log(event.message));
    projectInfoProviderFn = jest.fn();

    service = new ProjectInfoService(
      interactionHistory,
      projectInfoProviderFn as ProjectInfoProvider
    );
  });

  afterEach(() => jest.resetAllMocks());

  test('no project info found', async () => {
    projectInfoProviderFn.mockResolvedValueOnce(undefined);
    const result = await service.lookupProjectInfo();
    expect(result).toEqual([]);
    expect(interactionHistory.events).toEqual([]);
  });

  describe('project info obtained', () => {
    test('all values missing', async () => {
      const projectInfo = [
        {
          directory: '/some/path',
        },
      ];
      projectInfoProviderFn.mockResolvedValueOnce(projectInfo);
      const result = await service.lookupProjectInfo();
      expect(result).toEqual(projectInfo);
      expect(interactionHistory.events.map((event) => event.metadata)).toEqual([
        {
          name: 'appmapConfig',
          role: 'user',
          type: 'prompt',
        },
        {
          name: 'appmapStats',
          role: 'user',
          type: 'prompt',
        },
        {
          name: 'codeEditor',
          role: 'user',
          type: 'prompt',
        },
      ]);

      expect(interactionHistory.buildState().messages).toEqual([
        {
          content: 'The project does not contain an AppMap config file (appmap.yml).',
          role: 'user',
        },
        {
          content: 'The project does not contain any AppMaps.',
          role: 'user',
        },
        {
          content: 'The code editor is not specified.',
          role: 'user',
        },
      ]);
    });

    test('appmapConfig present', async () => {
      const projectInfo = [
        {
          directory: '/some/path',
          appmapConfig: {
            name: 'appmap',
            language: 'ruby',
            appmap_dir: 'tmp/appmap',
            packages: {},
          },
        },
      ];
      projectInfoProviderFn.mockResolvedValueOnce(projectInfo);
      await service.lookupProjectInfo();
      const messages = interactionHistory.buildState().messages;
      expect(messages).toHaveLength(4);
      const instructionPrompt = messages[0];
      const valuePrompt = messages[1];
      expect(instructionPrompt.content).toContain('**AppMap configuration**');
      expect(valuePrompt.content).toContain('<appmap-config>');
      expect(valuePrompt.content).toContain('name: appmap');
    });

    test('appmapStats present', async () => {
      const projectInfo = [
        {
          directory: '/some/path',
          appmapStats: {
            packages: ['appmap'],
            routes: ['GET /'],
            tables: ['users'],
            numAppMaps: 1,
          },
        },
      ];
      projectInfoProviderFn.mockResolvedValueOnce(projectInfo);
      await service.lookupProjectInfo();
      const messages = interactionHistory.buildState().messages;
      expect(messages).toHaveLength(4);
      const instructionPrompt = messages[1];
      const valuePrompt = messages[2];
      expect(instructionPrompt.content).toContain('**AppMap statistics**');
      expect(valuePrompt.content).toContain('<appmap-stats>');
      expect(valuePrompt.content).toContain('numAppMaps: 1');
    });

    test('codeEditor present', async () => {
      const projectInfo = [
        {
          directory: '/some/path',
          codeEditor: {
            name: 'vscode',
          },
        },
      ];
      projectInfoProviderFn.mockResolvedValueOnce(projectInfo);
      await service.lookupProjectInfo();
      const messages = interactionHistory.buildState().messages;
      expect(messages).toHaveLength(4);
      const instructionPrompt = messages[2];
      const valuePrompt = messages[3];
      expect(instructionPrompt.content).toContain('**Code editor**');
      expect(valuePrompt.content).toContain('<code-editor>');
      expect(valuePrompt.content).toContain('name: vscode');
    });
  });
});
