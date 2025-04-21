import { warn } from 'node:console';

import yargs from 'yargs';

import { loadConfiguration } from '@appland/client';

import { verbose } from '../../utils';
import { search } from '../../rpc/search/search';
import appmapFilter from '../../rpc/appmap/filter';
import { RpcHandler } from '../../rpc/rpc';
import metadata from '../../rpc/appmap/metadata';
import sequenceDiagram from '../../rpc/appmap/sequenceDiagram';
import { explainHandler, explainStatusHandler } from '../../rpc/explain/explain';
import { buildNavieProvider, commonNavieArgsBuilder as navieBuilder } from '../navie';
import RPCServer from './rpcServer';
import appmapData from '../../rpc/appmap/data';
import { appmapStatsV1, appmapStatsV2 } from '../../rpc/appmap/stats';
import { configureRpcDirectories } from '../../lib/handleWorkingDirectory';
import observePerformance from '../../lib/observePerformance';
import {
  getConfigurationV1,
  getConfigurationV2,
  setConfigurationV1,
  setConfigurationV2,
} from '../../rpc/configuration';
import detectCodeEditor from '../../lib/detectCodeEditor';
import { update } from '../../rpc/file/update';
import { INavieProvider } from '../../rpc/explain/navie/inavie';
import { navieMetadataV1, navieMetadataV2 } from '../../rpc/navie/metadata';
import { navieSuggestHandlerV1 } from '../../rpc/navie/suggest';
import { navieWelcomeV2 } from '../../rpc/navie/welcome';
import { navieRegisterV1 } from '../../rpc/navie/register';
import ModelRegistry from '../../rpc/navie/models/registry';
import { navieModelsAddV1 } from '../../rpc/navie/models/handlers/add';
import { navieModelsListV1 } from '../../rpc/navie/models/handlers/list';
import { navieModelsSelectV1 } from '../../rpc/navie/models/handlers/select';
import { navieModelsGetConfigV1 } from '../../rpc/navie/models/handlers/getConfig';
import { navieThreadSendMessageHandler } from '../../rpc/navie/thread/handlers/sendMessage';
import {
  navieThreadPinItemHandler,
  navieThreadUnpinItemHandler,
} from '../../rpc/navie/thread/handlers/pinItem';
import { navieThreadQueryHandler } from '../../rpc/navie/thread/handlers/query';
import NavieService from '../../rpc/navie/services/navieService';
import { ThreadIndexService } from '../../rpc/navie/services/threadIndexService';
import { container } from 'tsyringe';
import ThreadService from '../../rpc/navie/services/threadService';
import {
  navieThreadAddMessageAttachmentHandler,
  navieThreadRemoveMessageAttachmentHandler,
} from '../../rpc/navie/thread/handlers/messageAttachment';

export const command = 'rpc';
export const describe = 'Run AppMap JSON-RPC server';

export const builder = <T>(args: yargs.Argv<T>) => {
  return navieBuilder(args)
    .option('port', {
      describe:
        'port to listen on for JSON-RPC requests. Use port 0 to let the OS choose a port. The port number will be printed to stdout on startup.',
      type: 'number',
      alias: 'p',
      default: 0,
    })
    .strict();
};

type GetArgv<T> = T extends yargs.Argv<infer A> ? A : never;
type HandlerArguments = yargs.ArgumentsCamelCase<
  GetArgv<ReturnType<typeof builder>> & { verbose?: boolean }
>;

export function rpcMethods(navie: INavieProvider, codeEditor?: string): RpcHandler<any, any>[] {
  const threadService = container.resolve(ThreadService);
  const threadIndexService = container.resolve(ThreadIndexService);
  return [
    search(),
    appmapStatsV1(),
    appmapStatsV2(),
    appmapFilter(),
    appmapData(),
    metadata(),
    sequenceDiagram(),
    explainHandler(navie, codeEditor),
    explainStatusHandler(),
    update(navie),
    setConfigurationV1(),
    getConfigurationV1(),
    setConfigurationV2(),
    getConfigurationV2(),
    navieMetadataV1(),
    navieMetadataV2(),
    navieSuggestHandlerV1(navie),
    navieWelcomeV2(navie),
    navieModelsAddV1(),
    navieModelsListV1(),
    navieModelsSelectV1(),
    navieModelsGetConfigV1(),
    navieRegisterV1(threadService, codeEditor),
    navieThreadSendMessageHandler(threadService),
    navieThreadPinItemHandler(threadService),
    navieThreadUnpinItemHandler(threadService),
    navieThreadQueryHandler(threadIndexService),
    navieThreadAddMessageAttachmentHandler(threadService),
    navieThreadRemoveMessageAttachmentHandler(threadService),
  ];
}

export const handler = async (argv: HandlerArguments) => {
  observePerformance();
  verbose(argv.verbose);

  ModelRegistry.instance.refresh().catch((e) => {
    console.error(`failed to intialize model registry: ${String(e)}`);
  });

  const navie = buildNavieProvider(argv);

  await ThreadIndexService.useDefault();
  NavieService.bindNavieProvider(navie);

  let codeEditor: string | undefined = argv.codeEditor;
  if (!codeEditor) {
    codeEditor = detectCodeEditor();
    if (codeEditor) warn(`Detected code editor: ${codeEditor}`);
  }

  loadConfiguration(false);
  await configureRpcDirectories(argv.directory);

  const rpcServer = new RPCServer(argv.port, rpcMethods(navie, codeEditor));
  rpcServer.start();
};
