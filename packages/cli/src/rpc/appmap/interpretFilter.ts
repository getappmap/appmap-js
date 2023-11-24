import { AppMapFilter, deserializeFilter } from '@appland/models';

export default function interpretFilter(
  filter: string | Record<string, any> | undefined
): AppMapFilter | undefined {
  if (!filter) return;

  return deserializeFilter(filter);
}
