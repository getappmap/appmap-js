import { ContextV2 } from '../context';

export class UserOptions {
  constructor(private options: Map<string, string | boolean>) {}

  /**
   * @returns A new instance of UserOptions with the same options.
   * This is useful for creating a copy of the options without modifying the original.
   */
  clone(): UserOptions {
    return new UserOptions(new Map(this.options));
  }

  /**
   * Sets an option with the given key and value.
   * If the value is a string, it is stored as is.
   * If the value is a boolean, it is stored as a boolean.
   * @param key The option key.
   * @param value The option value, either a string or a boolean.
   */
  set(key: string, value: string | boolean): UserOptions {
    this.options.set(key.toLowerCase(), value);
    return this;
  }

  /**
   * Removes an option with the given key.
   * @param key The option key to remove.
   */
  delete(key: string): UserOptions {
    this.options.delete(key.toLowerCase());
    return this;
  }

  has(key: string): boolean {
    return this.options.has(key);
  }

  isEnabled(key: string, defaultValue: boolean): boolean {
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

  booleanValue(key: string, defaultValue: boolean): boolean {
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

  populateContextFilters(filters: ContextV2.ContextFilters) {
    const exclude = this.stringValue('exclude');
    if (exclude) filters.exclude = [exclude];

    const include = this.stringValue('include');
    if (include) filters.include = [include];

    const types = this.stringValue('itemtype');
    if (types)
      filters.itemTypes = types.split(',').map((type) => type as ContextV2.ContextItemType);
  }
}

export default function parseOptions(question: string): {
  options: UserOptions;
  question: string;
} {
  // eslint-disable-next-line no-param-reassign
  question = question.trimStart();
  if (!question) return { options: new UserOptions(new Map()), question: '' };

  const options = new Map<string, string | boolean>();
  const optionPattern = /^\/(?:[a-zA-Z0-9-]+)(?:=[^ ]+)?/;
  const words = question.split('\n')[0].split(' ');
  const restLines = question.split('\n').slice(1);
  const skippedWords = new Array<string>();

  let i = 0;
  for (; i < words.length; i += 1) {
    const word = words[i];

    // Disregard command directives and empty words
    if (word.startsWith('@') || !word.trim()) {
      skippedWords.push(word);
      continue;
    }

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

  const remainingQuestion = [[...skippedWords, ...words.slice(i)].join(' '), ...restLines].join(
    '\n'
  );
  return { options: new UserOptions(options), question: remainingQuestion };
}
