type TagInfo = {
  // If present, the value of the tag. If endIndex is not present, this is likely
  // only a partial value.
  value?: string;

  // The character index of the start of the tag
  // The presence of this property does not guarantee that the tag is closed or
  // that the tag is even fully formed.
  startIndex: number;

  // The index at the end of the tag, exclusive.
  // If this is undefined, the tag is not yet closed.
  endIndex?: number;
};

function findTag(tag: string, buffer: string, offset = 0): TagInfo | undefined {
  let matchIndex = 0;
  let startingIndex = 0;
  for (let i = offset; i < buffer.length; i += 1) {
    if (buffer[i] === tag[matchIndex]) {
      if (matchIndex === 0) {
        startingIndex = i;
      }
      matchIndex += 1;
    } else {
      matchIndex = 0;
    }

    if (matchIndex === tag.length) {
      return {
        startIndex: startingIndex,
        endIndex: i + 1,
      };
    }
  }
  return matchIndex === 0 ? undefined : { startIndex: startingIndex };
}

export default class XMLMarkdownTransformer {
  private buffer = '';

  private flushBuffer(callback: (chunk: string) => void): void {
    callback(this.buffer);
    this.buffer = '';
  }

  // If possible, returns a TagInfo indicating how much of the tag has been located.
  // If the tag is not capable of being parsed, i.e., the content cannot contain the
  // tag, the return value will be undefined.
  private getTag(tag: string, buffer?: string): TagInfo | undefined {
    const bufferToSearch = buffer ?? this.buffer;
    const openingTag = findTag(`<${tag}>`, bufferToSearch);
    if (!openingTag) {
      return undefined;
    }

    if (openingTag.endIndex === undefined) {
      return {
        startIndex: openingTag.startIndex,
      };
    }

    const closingTag = findTag(`</${tag}>`, bufferToSearch, openingTag.endIndex);
    if (!closingTag) {
      return {
        value: bufferToSearch.slice(openingTag.endIndex),
        startIndex: openingTag.startIndex,
      };
    }

    return {
      value: bufferToSearch.slice(openingTag.endIndex, closingTag.startIndex),
      startIndex: openingTag.startIndex,
      endIndex: closingTag.endIndex,
    };
  }

  /*
    TODO:
    - Drop the CDATA tags
    - Stream the output after reaching the opening <content> tag
    - Handle cases where the LLM uses ``` instead of <code>
  */
  transform(chunk: string, callback: (chunk: string) => void) {
    this.buffer += chunk;

    const code = this.getTag('code');
    if (!code) {
      this.flushBuffer(callback);
      return;
    }

    if (code.endIndex === undefined) {
      return;
    }

    const language = this.getTag('language', code.value);
    if (!language || language.value === undefined) {
      this.flushBuffer(callback);
      return;
    }

    const file = this.getTag('file', code.value);
    if (!file || file.value === undefined) {
      this.flushBuffer(callback);
      return;
    }

    const content = this.getTag('content', code.value);
    if (!content || content.value === undefined) {
      this.flushBuffer(callback);
      return;
    }

    this.buffer = [
      this.buffer.slice(0, code.startIndex),
      `<!-- file: ${file.value} -->`,
      `\`\`\`${language.value.toLowerCase()}`,
      content.value,
      '```',
      this.buffer.slice(code.endIndex),
    ]
      .filter(Boolean)
      .join('\n');

    this.flushBuffer(callback);
  }
}
