import { AppMapRpc } from '@appland/rpc';
import { RpcHandler } from '../rpc';
import {
  FormatType,
  SequenceDiagramOptions,
  Specification,
  buildDiagram,
  format,
} from '@appland/sequence-diagram';
import { buildAppMap } from '@appland/models';
import { readFile } from 'fs/promises';
import { appmapFile } from './appmapFile';
import interpretFilter from './interpretFilter';

export default function sequenceDiagram(): RpcHandler<
  AppMapRpc.SequenceDiagramOptions,
  AppMapRpc.SequenceDiagramResponse
> {
  async function handler(
    args: AppMapRpc.SequenceDiagramOptions
  ): Promise<AppMapRpc.SequenceDiagramResponse> {
    let {
      appmap: appmapId,
      filter: filterArg,
      format: formatArg,
      formatOptions: formatOptionsArg,
    } = args;

    const diagramFormat = (formatArg || FormatType.JSON) as FormatType;
    const diagramFormatOptions: Record<string, boolean | string> = formatOptionsArg || {};

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
    let result = format(diagramFormat, diagram, appmapFile(appmapId), diagramFormatOptions).diagram;
    if (diagramFormat === FormatType.JSON) result = JSON.parse(result);
    return result;
  }

  return { name: AppMapRpc.SequenceDiagramFunctionName, handler };
}
