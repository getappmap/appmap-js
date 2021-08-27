import detectIndent from 'detect-indent';

export class Whitespace {
  public readonly type: 'tab' | 'space';
  public readonly width: number;

  constructor(type?: 'tab' | 'space', width?: number) {
    this.type = type || 'space';
    this.width = width || 2;
  }

  get char(): string {
    return this.type === 'tab' ? '\t' : ' ';
  }

  padLine(line: string, width?: number): string {
    const finalWidth = width === undefined ? this.width : width;
    return new Array(finalWidth).fill(this.char).join('') + line;
  }
}

export function getWhitespace(source: string): Whitespace {
  const { type, amount: width } = detectIndent(source);
  return new Whitespace(type, width);
}

export function getColumn(source: string, index: number): number {
  const previousNewLineIndex = source.substring(0, index).lastIndexOf('\n');

  if (previousNewLineIndex === -1) {
    return index;
  }

  return index - previousNewLineIndex - 1;
}
