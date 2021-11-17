import { Minimatch } from 'minimatch';

export default class MatchPattern {
  private expression: string | RegExp;
  private pattern: RegExp;

  private constructor(expression: string | RegExp) {
    if (!expression || expression === '') {
      throw new Error(`Match pattern must not be empty`);
    }
    this.expression = expression;
    if (typeof expression === 'string') {
      const expressionStr = expression as string;
      if (
        expressionStr.charAt(0) === '/' &&
        expressionStr.charAt(expressionStr.length - 1) === '/'
      ) {
        this.pattern = new RegExp(expressionStr.slice(1, expressionStr.length - 1));
      } else {
        this.pattern = new Minimatch(expressionStr).makeRe();
        if (!this.pattern) {
          throw new Error(`Invalid match pattern: ${expressionStr}`);
        }
      }
    } else {
      this.pattern = expression as RegExp;
    }
  }

  static build(value: RegExp | string): MatchPattern {
    return new MatchPattern(value);
  }

  static buildArray(value: RegExp[] | string[]): MatchPattern[] {
    return value.map((item) => this.build(item));
  }

  toString(): string {
    return this.expression.toString();
  }

  test(value: string): boolean {
    return this.pattern.test(value);
  }
}
