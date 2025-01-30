import { container } from 'tsyringe';
import { ContextService } from '../../../../../src/rpc/navie/services/contextService';

jest.mock('../../../../../src/rpc/explain/collect-context.ts', () => {
  return {
    __esModule: true,
    default: jest.fn().mockResolvedValue({ context: [] }),
    buildContextRequest: jest.fn().mockReturnValue({}),
  };
});

jest.mock('../../../../../src/cmds/navie/projectInfo.ts', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('../../../../../src/cmds/navie/help.ts', () => {
  return {
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('../../../../../src/rpc/configuration.ts', () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue({
      appmapDirectories: jest.fn().mockResolvedValue([]),
      projectDirectories: [],
    }),
  };
});

jest.mock('../../../../../src/lib/detectCodeEditor.ts', () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue('test-editor'),
  };
});

import collectContext, {
  buildContextRequest,
} from '../../../../../src/rpc/explain/collect-context';
import collectProjectInfos from '../../../../../src/cmds/navie/projectInfo';
import collectHelp from '../../../../../src/cmds/navie/help';
import { Help } from '@appland/navie';

const mockedBuildContextRequest = jest.mocked(buildContextRequest);
const mockedCollectContext = jest.mocked(collectContext);
const mockedCollectProjectInfos = jest.mocked(collectProjectInfos);
const mockedCollectHelp = jest.mocked(collectHelp);

describe('ContextService', () => {
  let contextService: ContextService;

  beforeEach(() => {
    container.reset();
    contextService = container.resolve(ContextService);
  });

  describe('searchContext', () => {
    it('calls collectContext with the correct parameters', async () => {
      const vectorTerms = ['foo', 'bar'];
      const tokenCount = 10;
      const data = { vectorTerms, tokenCount };
      await contextService.searchContext(data);
      expect(mockedBuildContextRequest).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        undefined,
        vectorTerms,
        tokenCount * 3,
        data
      );
      expect(mockedCollectContext).toHaveBeenCalled();
    });
  });

  describe('projectInfoContext', () => {
    it('calls collectProjectInfos', async () => {
      await contextService.projectInfoContext();
      expect(mockedCollectProjectInfos).toHaveBeenCalledWith('test-editor');
    });
  });

  describe('helpContext', () => {
    it('calls collectHelp', async () => {
      const data: Help.HelpRequest = { type: 'help', vectorTerms: ['help'], tokenCount: 10 };
      await contextService.helpContext(data);
      expect(mockedCollectHelp).toHaveBeenCalledWith(data);
    });
  });
});
