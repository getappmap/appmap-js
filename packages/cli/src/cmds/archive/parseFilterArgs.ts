import { warn } from 'console';
import { CompareFilter } from '../../lib/loadAppMapConfig';

export default function parseFilterArgs(compareFilter: CompareFilter, filterArgs: string[]) {
  const filters = new Map<string, string[]>();
  for (const filter of filterArgs) {
    const [key, v] = filter.split('=');
    if (!filters.has(key)) filters.set(key, []);
    filters.get(key)?.push(v);
  }
  for (const [key, values] of filters.entries()) {
    if (key === 'hide_external') {
      if (values.length !== 1) {
        warn(`hide_external should not be repeated, got: ${values.join(', ')}`);
        continue;
      }
      const value = values[0];
      if (value === 'true') compareFilter[key] = true;
      else if (value === 'false') compareFilter[key] = false;
      else warn(`Invalid value for hide_external: ${value}`);
    } else {
      if (!compareFilter[key]) compareFilter[key] = [];
      compareFilter[key].push(...values);
    }
  }
}
