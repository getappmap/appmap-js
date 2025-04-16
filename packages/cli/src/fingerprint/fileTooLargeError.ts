import prettyBytes from 'pretty-bytes';

export default class FileTooLargeError extends Error {
  constructor(public path: string, public bytes: number, public maxBytes: number) {
    super();
  }

  name = 'FileTooLargeError';

  get message(): string {
    const size = prettyBytes(this.bytes);
    const maxSize = prettyBytes(this.maxBytes);
    return `File ${this.path} is too large to process (${size}).\nPlease make sure that appmaps are no larger than ${maxSize}.`;
  }
}
