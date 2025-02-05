import { ContextV2 } from '../../src';
import { CommandMode } from '../../src/command';
import InteractionHistory, { ContextLookupEvent } from '../../src/interaction-history';
import { NavieHeaders } from '../../src/lib/navie-headers';
import { NavieOptions } from '../../src/navie';

describe('NavieHeaders', () => {
  describe('x-appmap-navie-appmap-count', () => {
    it('collects appmap data references', () => {
      const history = new InteractionHistory();
      const headers = new NavieHeaders(history, new NavieOptions(), CommandMode.Explain);
      history.addEvent(
        new ContextLookupEvent([
          {
            type: ContextV2.ContextItemType.SequenceDiagram,
            location: 'same.appmap.json',
            directory: '/home/user',
            content: '---',
          },
          {
            type: ContextV2.ContextItemType.DataRequest,
            location: 'same.appmap.json',
            directory: '/home/user',
            content: '---',
          },
          {
            type: ContextV2.ContextItemType.SequenceDiagram,
            location: 'different.appmap.json',
            directory: '/home/user',
            content: '---',
          },
        ])
      );
      const result = headers.buildHeaders();
      expect(result['x-appmap-navie-appmap-count']).toEqual('2');
    });

    it('is zero when no appmap data references are found', () => {
      const history = new InteractionHistory();
      const headers = new NavieHeaders(history, new NavieOptions(), CommandMode.Explain);
      const result = headers.buildHeaders();
      expect(result['x-appmap-navie-appmap-count']).toEqual('0');
    });
  });

  describe('x-appmap-navie-request-id', () => {
    const history = new InteractionHistory();

    it('is a uuid', () => {
      const headers = new NavieHeaders(history, new NavieOptions(), CommandMode.Explain);
      const result = headers.buildHeaders();
      expect(result['x-appmap-navie-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('x-appmap-navie-model', () => {
    const history = new InteractionHistory();

    it('is the model name', () => {
      const modelName = 'gpt-4o';
      const headers = new NavieHeaders(
        history,
        new NavieOptions({ modelName }),
        CommandMode.Explain
      );
      const result = headers.buildHeaders();
      expect(result['x-appmap-navie-model']).toEqual(modelName);
    });
  });

  describe('x-appmap-navie-command', () => {
    const history = new InteractionHistory();

    it('is the command name', () => {
      const headers = new NavieHeaders(history, new NavieOptions(), CommandMode.Review);
      const result = headers.buildHeaders();
      expect(result['x-appmap-navie-command']).toEqual(CommandMode.Review);
    });
  });

  describe('user-agent', () => {
    const history = new InteractionHistory();

    it('includes the product name', () => {
      const product = 'AppMap Navie';
      const headers = new NavieHeaders(
        history,
        new NavieOptions({ metadata: { product } }),
        CommandMode.Explain
      );
      const result = headers.buildHeaders();
      expect(result['user-agent']).toContain(product);
    });

    it('includes the version', () => {
      const version = '1.2.3';
      const headers = new NavieHeaders(
        history,
        new NavieOptions({ metadata: { version } }),
        CommandMode.Explain
      );
      const result = headers.buildHeaders();
      expect(result['user-agent']).toContain(version);
    });

    it('includes the code editor', () => {
      const codeEditor = 'vscode';
      const headers = new NavieHeaders(
        history,
        new NavieOptions({ metadata: { codeEditor } }),
        CommandMode.Explain
      );
      const result = headers.buildHeaders();
      expect(result['user-agent']).toContain(codeEditor);
    });

    it('includes the operating system and architecture', () => {
      const headers = new NavieHeaders(history, new NavieOptions(), CommandMode.Explain);
      const result = headers.buildHeaders();
      expect(result['user-agent']).toContain(process.platform);
      expect(result['user-agent']).toContain(process.arch);
    });

    it('includes the runtime and version', () => {
      const headers = new NavieHeaders(history, new NavieOptions(), CommandMode.Explain);
      const result = headers.buildHeaders();
      expect(result['user-agent']).toContain(process.release.name);
      expect(result['user-agent']).toContain(process.versions.node);
    });
  });
});
