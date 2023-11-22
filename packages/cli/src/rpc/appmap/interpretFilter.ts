import { AppMapFilter, FilterState, deserializeFilter } from '@appland/models';

export default function interpretFilter(
  filter: string | Record<string, any> | undefined
): AppMapFilter | undefined {
  if (!filter) return;

  const loadFilterObj = (): AppMapFilter | undefined => {
    if (typeof filter === 'object') return deserializeFilter(filter as FilterState);
  };

  const loadFilterString = (): AppMapFilter | undefined => {
    return deserializeFilter(filter);
  };

  return loadFilterObj() || loadFilterString();
}
