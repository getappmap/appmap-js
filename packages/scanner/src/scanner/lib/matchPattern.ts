import { AppMap, Event } from '@appland/models';
import { EventFilter, MatchPatternConfig } from 'src/types';
import { Script } from 'vm';

export function build(config: MatchPatternConfig | string | RegExp): EventFilter {
  const filterRegExp = (pattern: RegExp) => (event: Event) => pattern.test(event.codeObject.fqid);
  const filterString = (pattern: string) => filterRegExp(new RegExp(pattern));
  const filterFunction = (expression: string) => {
    const script = new Script(expression);
    return (event: Event, appMap?: AppMap) => {
      return script.runInNewContext({ event, appMap, console });
    };
  };

  if (config instanceof RegExp) {
    return filterRegExp(config as RegExp);
  } else if (typeof config === 'string') {
    return filterString(config as string);
  } else {
    const configObj = config as MatchPatternConfig;
    if (configObj.regexp) {
      return filterString(configObj.regexp!);
    } else {
      return filterFunction(configObj.function!);
    }
  }
}

export function buildArray(value: MatchPatternConfig[] | RegExp[] | string[]): EventFilter[] {
  return value.map((item) => build(item));
}
