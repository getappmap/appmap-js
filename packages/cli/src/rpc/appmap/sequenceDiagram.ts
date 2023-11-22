import { AppMapRpc } from '@appland/rpc';
import { RpcCallback, RpcHandler } from '../rpc';
import { SequenceDiagramOptions, Specification, buildDiagram } from '@appland/sequence-diagram';
import { buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { appmapFile } from './appmapFile';
import interpretFilter from './interpretFilter';

export default function sequenceDiagram(): RpcHandler<
  AppMapRpc.SequenceDiagramOptions,
  AppMapRpc.SequenceDiagramResponse
> {
  async function handler(
    args: AppMapRpc.SequenceDiagramOptions,
    callback: RpcCallback<AppMapRpc.SequenceDiagramResponse>
  ) {
    let { appmap: appmapId, filter: filterArg } = args;

    const filter = interpretFilter(filterArg);

    const appmapStr = await readFile(appmapFile(appmapId), 'utf8');
    let appmap = buildAppMap().source(appmapStr).build();
    if (filter) {
      appmap = filter.filter(appmap, []);
    }

    const optionsOpt = args.options;
    const options: SequenceDiagramOptions = optionsOpt
      ? (optionsOpt as SequenceDiagramOptions)
      : { loops: true };

    const specification = Specification.build(appmap, options);
    const diagram = buildDiagram(appmapFile(appmapId), appmap, specification);
    return callback(null, diagram);
  }

  return { name: AppMapRpc.SequenceDiagramFunctionName, handler };
}
