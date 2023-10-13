import Handlebars from 'handlebars';

const inspect = (value: any) => {
  return new Handlebars.SafeString(JSON.stringify(value, null, 2));
};

const length = (...list: any[]): number => {
  const _fn = list.pop();
  let result = 0;
  for (const item of list) {
    if (Array.isArray(item)) {
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
  return list.find((item) => item !== undefined && item !== '');
};

const extractArrayValue = (args: any[]): any[] => (Array.isArray(args[0]) ? args[0] : args);

const sum = (...args: any[]) => {
  args = [...args];
  const _fn = args.pop();
  const values = extractArrayValue(args);
  return values.reduce((a, b) => a + (b || 0), 0);
};

export default {
  inspect,
  length,
  coalesce,
  sum,
};
