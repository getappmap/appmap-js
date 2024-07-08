import mermaid from 'mermaid';

export default class MermaidValidator {
  constructor(public readonly diagram: string) {}

  // Validate the diagram. If the diagram is valid, return true. If the diagram is invalid,
  // return an array of error messages.
  // TODO: Reconsider the async-ness of this code, based on what Mermaid does in v10+
  // eslint-disable-next-line @typescript-eslint/require-await
  validate(): Promise<{ valid: boolean; error?: string }> {
    let error: string | undefined;
    mermaid.setParseErrorHandler((err: Error) => {
      error = err.message;
    });

    const valid = mermaid.parse(this.diagram);

    mermaid.setParseErrorHandler(() => {});

    if (valid) return Promise.resolve({ valid: true });

    return Promise.resolve({ valid: false, error });
  }
}
