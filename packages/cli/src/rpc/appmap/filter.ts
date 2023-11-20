import { buildAppMap, deserializeFilter } from '@appland/models';
import { FilterOptions, FilterResponse } from '.';
import { readFile } from 'fs/promises';
import { RpcCallback, RpcHandler } from '../rpc';

export default function appmapFilter(): RpcHandler<FilterOptions, FilterResponse> {
  async function handler(args: FilterOptions, callback: RpcCallback<FilterResponse>) {
    let { appmap: appmapId } = args;
    const { filter: filterArg } = args;

    const loadFilterObj = () => {
      if (typeof filterArg === 'object') return filterArg;
    };

    const loadFilterString = () => {
      try {
        return deserializeFilter(filterArg);
      } catch (err) {
        return null;
      }
    };

    const filter = loadFilterString() || loadFilterObj();
    if (!filter) {
      callback({ code: 422, message: 'Invalid filter' });
      return;
    }

    if (!appmapId.endsWith('.appmap.json')) appmapId = appmapId + '.appmap.json';
    const appmapStr = await readFile(appmapId, 'utf8');

    const appmap = buildAppMap().source(appmapStr).build();
    const filteredAppMap = filter.filter(appmap, []);
    callback(null, filteredAppMap);
  }

  return { name: 'appmap.filter', handler };
}
