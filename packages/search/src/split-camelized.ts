import { log } from 'console';

export const LOG_CAMELIZED_TO_RAW = process.env.APPMAP_LOG_CAMELIZED_TO_RAW === 'true';
export const CAMELIZED_TO_RAW = new Map<string, string>();

/**
 * Split a camelized word into a new word that is separated by a given separator.
 */
// Derived from https://raw.githubusercontent.com/sindresorhus/decamelize/main/index.js
// MIT License
// Copyright (c) Sindre Sorhus sindresorhus@gmail.com (https://sindresorhus.com)
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
export function splitCamelized(
  text: string,
  { separator = ' ', preserveConsecutiveUppercase = true } = {}
): string {
  const handlePreserveConsecutiveUppercase = (decamelized: string, separator: string): string => {
    // Lowercase all single uppercase characters. As we
    // want to preserve uppercase sequences, we cannot
    // simply lowercase the separated string at the end.
    // `data_For_USACounties` → `data_for_USACounties`
    const result = decamelized.replace(
      /((?<![\p{Uppercase_Letter}\d])[\p{Uppercase_Letter}\d](?![\p{Uppercase_Letter}\d]))/gu,
      ($0) => $0.toLowerCase()
    );

    // Remaining uppercase sequences will be separated from lowercase sequences.
    // `data_For_USACounties` → `data_for_USA_counties`
    return result.replace(
      /(\p{Uppercase_Letter}+)(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
      (_, $1, $2: string) => $1 + separator + $2.toLowerCase()
    );
  };

  // Checking the second character is done later on. Therefore process shorter strings here.
  if (text.length < 2) {
    return preserveConsecutiveUppercase ? text : text.toLowerCase();
  }

  const replacement = `$1${separator}$2`;

  // Split lowercase sequences followed by uppercase character.
  // `dataForUSACounties` → `data_For_USACounties`
  // `myURLstring → `my_URLstring`
  const decamelized = text.replace(
    /([\p{Lowercase_Letter}\d])(\p{Uppercase_Letter})/gu,
    replacement
  );

  let result: string;
  if (preserveConsecutiveUppercase) {
    result = handlePreserveConsecutiveUppercase(decamelized, separator);
  } else {
    // Split multiple uppercase characters followed by one or more lowercase characters.
    // `my_URLstring` → `my_ur_lstring`
    result = decamelized
      .replace(/(\p{Uppercase_Letter})(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu, replacement)
      .toLowerCase();
  }

  if (LOG_CAMELIZED_TO_RAW) {
    if (!CAMELIZED_TO_RAW.has(result)) {
      log(`[splitCamelized] ${text} → ${result}`);
      CAMELIZED_TO_RAW.set(result, text);
    }
  }

  return result;
}
