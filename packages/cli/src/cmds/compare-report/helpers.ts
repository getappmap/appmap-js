import Handlebars, { SafeString } from 'handlebars';
import { dump } from 'js-yaml';

const inspect = (value: any) => {
  return new Handlebars.SafeString(JSON.stringify(value, null, 2));
};

const length = (...list: any[]): number => {
  const _fn = list.pop();
  let result = 0;
  for (const item of list) {
    if (item === undefined || item === null) {
      // pass
    } else if (Array.isArray(item)) {
      result += item.length;
    } else if (item.constructor === Map) {
      result += item.size;
    } else if (typeof item === 'object') {
      result += Object.keys(item).length;
    }
  }
  return result;
};

const coalesce = (...list: any[]): number => {
  const _fn = list.pop();
  return list.find((item) => item !== undefined && item !== null && item !== '');
};

const extractArrayValue = (args: any[]): any[] => (Array.isArray(args[0]) ? args[0] : args);

const every = (...args: any[]): boolean => {
  args = [...args];
  const _fn = args.pop();
  return args.every((value) => !!value);
};

const eq = (...args: any[]): boolean => {
  args = [...args];
  const _fn = args.pop();
  if (args.length === 0) return false;
  const first = args[0];
  return args.every((value) => value === first);
};

const gt = (a: number, b: number) => a > b;

const lt = (a: number, b: number) => a < b;

const pluralize = (count: number, singular: string, plural?: string): string => {
  if (typeof plural !== 'string') plural = undefined;

  if (count === 1) return singular;
  else if (plural) return plural;
  else return [singular, 's'].join('');
};

const format_as_yaml = (value: any): SafeString => new Handlebars.SafeString(dump(value));

const sum = (...args: any[]) => {
  args = [...args];
  const _fn = args.pop();
  const values = extractArrayValue(args);
  return values.reduce((a, b) => a + (b || 0), 0);
};

const subtract = (...args: any[]) => {
  args = [...args];
  const _fn = args.pop();
  const initial = args.shift() || 0;
  return args.reduce((a, b) => a - (b || 0), initial);
};

const divide = (...args: any[]) => {
  args = [...args];
  const _fn = args.pop();
  const values = extractArrayValue(args);
  const initial = values.shift() || 0;
  return values.reduce((a, b) => a / (b || 1), initial);
};

const format_as_percentage = (value: number, precision: number): string => {
  return `${(value * 100).toFixed(precision)}%`;
};

// TODO: Customize this per-language, e.g. 'module' for Ruby.
const lang_package_alias = () => 'package';

const keys = (obj: any): any[] => {
  if (Array.isArray(obj)) return obj;
  if (obj.constructor === Map) return Array.from(obj.keys());
  if (typeof obj === 'object') return Object.keys(obj);
  return [];
};

const values = (obj: any): any[] => {
  if (Array.isArray(obj)) return obj;
  if (obj.constructor === Map) return Array.from(obj.values());
  if (typeof obj === 'object') return Object.values(obj);
  return [];
};

export default {
  divide,
  format_as_percentage,
  format_as_yaml,
  keys,
  inspect,
  lang_package_alias,
  length,
  coalesce,
  every,
  eq,
  gt,
  lt,
  pluralize,
  subtract,
  sum,
  values,
};
