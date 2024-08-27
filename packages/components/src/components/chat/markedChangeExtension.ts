import assert from 'assert';
import { diffLines } from 'diff';
import type { TokenizerAndRendererExtension, Tokens } from 'marked';
import { type QualifiedTag, SAXParser, type Tag } from 'sax';

type ChangeToken = {
  type: 'change';
  raw: string;
  original: string;
  modified: string;
  file: string;
  complete: boolean;
};

function isChangeToken(token: Tokens.Generic): token is ChangeToken {
  return token.type === 'change';
}

function quoteHTML(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

class Parser extends SAXParser {
  file = '';
  original = '';
  modified = '';
  lastTag = '';
  complete = true;

  onopentag(tag: Tag | QualifiedTag): void {
    this.lastTag = tag.name;
  }

  ontext(t: string): void {
    if (this.lastTag === 'FILE') this.file += t;
  }

  onerror(): void {
    if ('cdata' in this && this.cdata) this.oncdata(String(this.cdata));
    // drop last line, might be partial
    this.modified = this.modified.split('\n').slice(0, -1).join('\n');
    this.complete = false;
  }

  oncdata(cdata: string): void {
    if (this.lastTag === 'ORIGINAL') this.original += cdata;
    if (this.lastTag === 'MODIFIED') this.modified += cdata;
  }
}

const markedChangeExtension: TokenizerAndRendererExtension = {
  name: 'change',
  level: 'block',
  start: (src) => src.indexOf('<change>'),
  tokenizer: function (src) {
    const rule = /^<change>([\s\S]*?)(<\/change>|$)/;
    const match = rule.exec(src);
    if (match) {
      const parser = new Parser(false);
      parser.write(match[0]).close();
      const token = {
        type: 'change',
        raw: match[0],
        // remove initial newline that can be there from XML quoting
        original: parser.original.replace(/^\n/, ''),
        modified: parser.modified.replace(/^\n/, ''),
        file: parser.file.trim(),
        complete: parser.complete,
      };
      return token;
    }
  },
  renderer: function (token) {
    assert(isChangeToken(token));
    const { file, complete, original, modified } = token;
    const diff = diffLines(original, complete ? modified : matchLines(modified, original));
    let result = `<v-markdown-code-snippet language="diff" location="${encodeURIComponent(
      file.trim()
    )}">`;
    result += diff
      .map((change) => {
        const linePrefix = change.added ? '+' : change.removed ? '-' : ' ';
        return quoteHTML(linePrefix + change.value.replace(/\n(?=.)/g, `\n${linePrefix}`));
      })
      .join('');
    if (complete)
      result += `<change><original>${prepareCode(original)}</original><modified>${prepareCode(
        modified
      )}</modified></change>`;
    result += '</v-markdown-code-snippet>';
    return result;
  },
};

// remove the final newline, then quote html
function prepareCode(s: string): string {
  return quoteHTML(s.replace(/\n$/g, ''));
}

// this tries to match lines from the original to
// present an incomplete patch nicely
function matchLines(modified: string, original: string): string {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  const result = [];

  for (const [index, line] of modifiedLines.entries()) {
    result.push(line);
    if (!line.trim()) {
      if (!originalLines[0]) originalLines.shift();
      else if (index === modifiedLines.length - 1) result.pop();
    } else {
      const index = originalLines.indexOf(line);
      if (index !== -1) originalLines.splice(0, index + 1);
    }
  }
  result.push(...originalLines);

  return result.join('\n');
}

export default markedChangeExtension;
