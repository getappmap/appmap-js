interface UpdateOptions {
  version?: string;
  codeEditor?: string;
}

export default class RequestHeaders {
  private version?: string;
  private codeEditor?: string;
  private platform: string = `${process.platform}-${process.arch}`;
  private nodeVersion: string = `${process.release.name} ${process.versions.node}`;

  static instance = new RequestHeaders();
  private constructor() {
    // nothing to do
  }

  update(opts: UpdateOptions) {
    if (opts.version) this.version = opts.version;
    if (opts.codeEditor) this.codeEditor = opts.codeEditor;
  }

  buildHeaders(): Record<string, string> {
    const product = ['AppMap Navie', this.version].filter(Boolean).join('/');
    const info = [this.platform, this.nodeVersion, this.codeEditor].filter(Boolean).join('; ');
    return {
      'User-Agent': `${product} (${info})`,
    };
  }
}
