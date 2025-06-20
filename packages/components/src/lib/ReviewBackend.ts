import type { ReviewRpc } from '@appland/rpc';

import type Review from '../pages/Review.vue';

import type { ExplainRequest } from './AppMapRPC';
import AppMapRPC from './AppMapRPC';

type Options = Partial<Pick<ReviewRpc.Review, 'suggestions' | 'features'>> & {
  rpcPort: number;
};

class ReviewBackend {
  rpc?: AppMapRPC | undefined;

  constructor(public review: InstanceType<typeof Review>, options: Options) {
    review.$props.suggestions = options.suggestions;
    review.$props.features = options.features;
    review.$props.loading = options.suggestions ? false : true;
    if (options.rpcPort) this.rpc = new AppMapRPC(options.rpcPort);
  }

  update(update: Partial<ReviewRpc.Review>) {
    if (update.suggestions) this.review.$props.suggestions = update.suggestions;
    if (update.features) this.review.$props.features = update.features;
  }

  attach(explain: ExplainRequest) {
    let buffer = '';

    const recv = (data: string) => {
      console.log('Received data:', data);
      buffer += data;
      while (buffer.includes('\n')) {
        const lineEndIndex = buffer.indexOf('\n');
        const line = buffer.slice(0, lineEndIndex);
        buffer = buffer.slice(lineEndIndex + 1);
        if (!line) continue; // Skip empty lines
        try {
          const update = JSON.parse(line);
          if (typeof update === 'object') this.update(update);
        } catch (error) {
          console.error('Failed to parse line:', line, error);
        }
      }
    };

    explain.on('token', recv);
    explain.on('complete', this.review.$props.loading);
  }

  startReview(baseRef?: string) {
    if (!this.rpc) {
      console.error('RPC is not initialized');
      return;
    }

    const explain = this.rpc.explain();
    let prompt = `@review /review2 /format=jsonl`;
    if (baseRef) prompt += ` /base=${baseRef}`;
    console.log('Starting explain with prompt:', prompt);
    explain.explain(prompt);
    this.attach(explain);
  }
}

export default ReviewBackend;
