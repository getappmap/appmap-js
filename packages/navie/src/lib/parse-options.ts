export class UserOptions {
  constructor(private options: Map<string, string | boolean>) {}

  has(key: string): boolean {
    return this.options.has(key);
  }

  isEnabled(key: string, defaultValue?: boolean): boolean | undefined {
    return this.booleanValue(key, defaultValue);
  }

  numberValue(key: string, defaultValue?: number): number | undefined {
    if (!this.options.has(key)) return defaultValue;

    const value = this.options.get(key);
    if (typeof value === 'string') {
      const numberValue = parseInt(value, 10);
      if (!Number.isNaN(numberValue)) return numberValue;
    }

    return defaultValue;
  }

  booleanValue(key: string, defaultValue?: boolean): boolean | undefined {
    if (!this.options.has(key)) return defaultValue;

    const value = this.options.get(key);
    if (typeof value === 'boolean') return value;

    return defaultValue;
  }

  stringValue(key: string, defaultValue?: string): string | undefined {
    if (!this.options.has(key)) return defaultValue;

    const value = this.options.get(key);
    if (typeof value === 'string') return value;

    return defaultValue;
  }
}

export default function parseOptions(question: string): {
  options: UserOptions;
  question: string;
} {
  const options = new Map<string, string | boolean>();
  const optionPattern = /^\/(?:[a-zA-Z0-9-]+)(?:=[^ ]+)?/;
  const words = question.split(' ');

  let i = 0;
  for (; i < words.length; i += 1) {
    const word = words[i];
    // eslint-disable-next-line no-continue
    if (!word.trim()) continue;

    if (!optionPattern.test(word)) break;

    const option = word.replace('/', '');
    let value: string | boolean;
    let key: string;
    const [keyStr, valueStr] = option.split('=');
    if (valueStr !== undefined) {
      key = keyStr;
      if (valueStr === 'true' || valueStr === 'yes' || valueStr === 'on') value = true;
      else if (valueStr === 'false' || valueStr === 'no' || valueStr === 'off') value = false;
      else value = valueStr;
    } else {
      // eslint-disable-next-line no-lonely-if
      if (keyStr.startsWith('no')) {
        key = keyStr.slice('no'.length);
        value = false;
      } else {
        key = keyStr;
        value = true;
      }
    }

    options.set(key.toLowerCase(), value);
  }

  const remainingQuestion = words.slice(i).join(' ');
  return { options: new UserOptions(options), question: remainingQuestion };
}
