import { container } from 'tsyringe';
import { INavieProvider } from '../../../../../src/rpc/explain/navie/inavie';
import NavieService from '../../../../../src/rpc/navie/services/navieService';
import EventEmitter from 'events';

describe('NavieService', () => {
  let provider: INavieProvider;
  let navieService: NavieService;
  beforeEach(() => {
    container.reset();
    provider = () => ({
      providerName: 'test',
      setOption: jest.fn(),
      ask: jest.fn(),
      on: jest.fn(),
      terminate: jest.fn(),
    });
    NavieService.bindNavieProvider(provider);
    navieService = container.resolve(NavieService);
  });

  describe('bindNavieProvider', () => {
    it('should bind the provider', () => {
      expect(container.resolve(NavieService).navieProvider).toBe(provider);
    });
  });

  describe('getNavie', () => {
    it('accepts a custom provider', () => {
      const providerName = 'custom-provider';
      const customProvider: INavieProvider = () => ({
        providerName,
        setOption: jest.fn(),
        ask: jest.fn(),
        on: jest.fn(),
        terminate: jest.fn(),
      });
      const [navie] = navieService.getNavie(customProvider);
      expect(navie.providerName).toBe(providerName);
    });

    it('returns a default provider if no custom provider is provided', () => {
      const [navie] = navieService.getNavie();
      expect(navie.providerName).toBe('test');
    });

    it('returns a context emitter', () => {
      const [, contextEmitter] = navieService.getNavie();
      expect(contextEmitter).toBeInstanceOf(EventEmitter);
    });
  });
});
