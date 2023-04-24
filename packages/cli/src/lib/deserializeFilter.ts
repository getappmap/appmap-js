import { AppMapFilter, deserializeAppmapState } from '@appland/models';
import { PruneFilter } from '../cmds/prune/pruneAppMap';

export default function deserializeFilter(
  serializedFilter: string,
  limitRootEvents?: boolean,
  hideMediaRequests?: boolean
): {
  filter: PruneFilter;
  appmapFilter: AppMapFilter;
} {
  const filterOrState = deserializeAppmapState(serializedFilter);
  const filter = 'filters' in filterOrState ? filterOrState.filters : filterOrState;

  const appmapFilter = new AppMapFilter();
  if (limitRootEvents !== undefined) appmapFilter.declutter.limitRootEvents.on = limitRootEvents;
  if (hideMediaRequests !== undefined)
    appmapFilter.declutter.hideMediaRequests.on = hideMediaRequests;
  appmapFilter.apply(filter);

  return { filter, appmapFilter };
}
