export type Chunk = {
  type: 'markdown' | 'diagram';
  content: string;
};

export default interface Filter {
  transform(chunk: string): AsyncIterable<Chunk>;

  end(): AsyncIterable<Chunk>;
}

export class NopFilter implements Filter {
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/require-await
  async *transform(chunk: string): AsyncIterable<Chunk> {
    yield { type: 'markdown', content: chunk };
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  async *end(): AsyncIterable<Chunk> {}
}
