import { AppMapFilter } from '@appland/models';

export function serializeAppMapFilter(appmapFilter: AppMapFilter): Record<string, any> {
  const { declutter } = appmapFilter;
  const declutterNames = Object.keys(declutter).filter((key) => declutter[key].on);
  return declutterNames
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      const declutterValue = { ...declutter[key] };
      delete declutterValue.on;
      delete declutterValue.default;
      delete declutterValue.defaultValue;
      acc[key] = declutterValue;
      return acc;
    }, {});
}
