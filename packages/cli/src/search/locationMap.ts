import { AppMap, ClassMap, CodeObject } from '@appland/models';
import isNumeric from '../lib/isNumeric';

export const Threshold = 20;

export default class LocationMap {
  lineNumbers: Map<string, number[]>;

  constructor(public classMap: ClassMap) {
    const lineNumbers: Map<string, number[]> = new Map();
    classMap.visit((co: CodeObject) => {
      if (!co.location) return;

      const [path, lineno] = co.location.split(':', 2);
      if (!path || !isNumeric(lineno)) return;

      if (!lineNumbers.get(path)) lineNumbers.set(path, []);

      lineNumbers.get(path)!.push(parseFloat(lineno));
    });

    this.lineNumbers = new Map<string, number[]>();
    for (const entry of lineNumbers) {
      this.lineNumbers.set(entry[0], [...entry[1].sort((a, b) => a - b)]);
    }
  }

  /**
   * Tests whether a test line number is contained within the function that starts at a given
   * line number.
   *
   * If the test line number is greater than the given line number and less than the
   * next known function line, returns true.
   *
   * If the test line number is greater than the given line number and greater than the
   * next known function line, returns false.
   *
   * If the test line number is greater than the given line number, and there is no greater
   * known function line, returns true if the test line number is within a threshold of
   * the given line number.
   *
   * @param path file path containing the function to test
   * @param lineNumber start line of the function
   * @param testLineNumber line number to test
   * @param threshold used if the testLineNumber is greater than the lineNumber, and there is
   * no known larger function line number in the code file (path).
   */
  functionContainsLine(
    path: string,
    lineNumber: number,
    testLineNumber: number,
    threshold = Threshold
  ): boolean {
    if (testLineNumber < lineNumber) return false;

    const lineNumbers = this.lineNumbers.get(path);
    if (!lineNumbers) return false;

    const lastLineNumber = lineNumbers[lineNumbers.length - 1];

    let containingFunctionLine: number | undefined;
    for (let i = 0; i < lineNumbers.length; i++) {
      const line = lineNumbers[i];
      if (line <= testLineNumber) containingFunctionLine = line;
      else break;
    }

    if (lineNumber === containingFunctionLine) {
      if (containingFunctionLine === lastLineNumber)
        return testLineNumber - lastLineNumber < threshold;
      else return true;
    }

    return false;
  }
}
