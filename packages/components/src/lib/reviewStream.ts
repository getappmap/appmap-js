import { EventEmitter } from 'events';

import type { ReviewRpc } from '@appland/rpc';

import type { ExplainRequest } from './AppMapRPC';
import AppMapRPC from './AppMapRPC';

class ReviewStream extends EventEmitter implements ReviewRpc.Review {
  suggestions: ReviewRpc.Suggestion[] = [];
  dismissedSuggestions: ReviewRpc.DismissedSuggestion[] = [];
  testCoverage: ReviewRpc.TestCoverageItem[] = [];
  features: ReviewRpc.Feature[] = [];
  dismissedFeatures: ReviewRpc.DismissedFeature[] = [];
  codeLabels: ReviewRpc.CodeLabelItem[] = [];

  constructor(init?: Partial<ReviewRpc.Review>) {
    super();
    if (init) {
      Object.assign(this, init);
    }
  }

  update(update: Partial<ReviewRpc.Review>): void {
    Object.assign(this, update);
    this.emit('update', update);
  }

  static from(explain: ExplainRequest): ReviewStream {
    const review = new ReviewStream();
    let buffer = '';
    explain.on('token', (token) => {
      console.log('Received token, current buffer: ', buffer, token);
      buffer += token;
      while (buffer.includes('\n')) {
        const lineEndIndex = buffer.indexOf('\n');
        const line = buffer.slice(0, lineEndIndex);
        buffer = buffer.slice(lineEndIndex + 1);

        if (!line) continue; // Skip empty lines
        try {
          const update = JSON.parse(line);
          if (typeof update === 'object') review.update(update);
        } catch (error) {
          console.error('Failed to parse line:', line, error);
        }
      }
    });
    return review;
  }

  static fromRpc(port: number, baseRef?: string): ReviewStream {
    const rpc = new AppMapRPC(port);
    const explain = rpc.explain();
    let prompt = '@review /review2 /format=jsonl';
    if (baseRef) prompt += ` /base=${baseRef}`;
    console.log('Starting explain with prompt:', prompt);
    explain.explain(prompt);

    return ReviewStream.from(explain);
  }
}

interface ReviewStream {
  on(event: 'update', listener: (update: Partial<ReviewRpc.Review>) => void): this;
}

export default ReviewStream;
