import { ContextV2, Help, ProjectInfo } from '@appland/navie';
import INavie, { INavieProvider } from '../../explain/navie/inavie';
import { ContextService } from './contextService';
import { randomUUID } from 'node:crypto';
import EventEmitter from 'node:events';
import { autoInjectable, container, inject } from 'tsyringe';

interface ContextEvent<Type, Req, Res> {
  type: Type;
  id: string;
  request: Req;
  response?: Res;
  complete?: boolean;
}

type ContextEvents =
  | ContextEvent<'context', ContextV2.ContextRequest, ContextV2.ContextResponse>
  | ContextEvent<'help', Help.HelpRequest, Help.HelpResponse>
  | ContextEvent<'project-info', undefined, ProjectInfo.ProjectInfoResponse>;

export interface ContextEmitter {
  on(event: 'context', listener: (event: ContextEvents) => void): this;
}

function contextEvent<
  Req extends ContextV2.ContextRequest | Help.HelpRequest | ProjectInfo.ProjectInfoRequest,
  Res extends ContextV2.ContextResponse | Help.HelpResponse | ProjectInfo.ProjectInfoResponse
>(
  emitter: EventEmitter,
  type: ContextEvents['type'],
  fn: (req: Req) => Promise<Res>
): (req: Req) => Promise<Res> {
  return async (req: Req) => {
    const requestId = randomUUID();
    emitter.emit('context', { type, id: requestId, request: req } as ContextEvents);
    const result = await fn(req);
    emitter.emit('context', {
      type,
      id: requestId,
      request: req,
      response: result,
      complete: true,
    } as ContextEvents);
    return result;
  };
}

@autoInjectable()
export default class NavieService {
  public static NAVIE_PROVIDER = 'INavieProvider';

  constructor(
    @inject(ContextService) private readonly contextService: ContextService,
    @inject(NavieService.NAVIE_PROVIDER) public readonly navieProvider: INavieProvider
  ) {}

  static bindNavieProvider(navieProvider?: INavieProvider) {
    container.registerInstance(this.NAVIE_PROVIDER, navieProvider);
  }

  getNavie(_navieProvider?: INavieProvider): [INavie, ContextEmitter] {
    const navieProvider = _navieProvider ?? this.navieProvider;
    const contextEmitter = new EventEmitter();
    const navie = navieProvider(
      contextEvent(contextEmitter, 'context', this.contextService.searchContext.bind(this)),
      contextEvent(
        contextEmitter,
        'project-info',
        this.contextService.projectInfoContext.bind(this)
      ),
      contextEvent(contextEmitter, 'help', this.contextService.helpContext.bind(this))
    );
    return [navie, contextEmitter as unknown as ContextEmitter];
  }
}
