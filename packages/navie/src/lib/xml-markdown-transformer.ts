export default class XMLMarkdownTransformer {
  private inMarkdown = false;
  private buffer = '';

  transform(chunk: string, callback: (chunk: string) => void) {
    this.buffer += chunk;

    while (this.buffer) {
      if (!this.inMarkdown) {
        const startMatch = this.buffer.match(
          /<code>\s*<language>(.*?)<\/language>\s*<file>(.*?)<\/file>\s*<content><!\[CDATA\[/s
        );
        if (startMatch) {
          callback(`<!-- ${startMatch[2]} -->\n\`\`\`${startMatch[1]}\n`);
          this.buffer = this.buffer.slice(startMatch.index! + startMatch[0].length);
          this.inMarkdown = true;
        } else {
          callback(this.buffer);
          this.buffer = '';
        }
      } else {
        const endMatch = this.buffer.match(/\]\]><\/content>\s*<\/code>/s);
        if (endMatch) {
          callback(this.buffer.slice(0, endMatch.index) + '\n```\n');
          this.buffer = this.buffer.slice(endMatch.index! + endMatch[0].length);
          this.inMarkdown = false;
        } else {
          callback(this.buffer);
          this.buffer = '';
          break;
        }
      }
    }
  }
}
