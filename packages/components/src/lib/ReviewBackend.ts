import type { ReviewRpc } from '@appland/rpc';

import type Review from '../pages/Review.vue';
import store from '../store/review';

import type { ExplainRequest } from './AppMapRPC';
import AppMapRPC from './AppMapRPC';

type Options = Partial<Pick<ReviewRpc.Review, 'suggestions' | 'features'>> & {
  rpcPort: number;
};

class ReviewBackend {
  rpc?: AppMapRPC | undefined;

  constructor(public review: InstanceType<typeof Review>, options: Options) {
    review.$store = store; // Set the Vuex store on the review component
    // Initialize store instead of directly setting props
    store.dispatch('updateSuggestions', options.suggestions);
    store.dispatch('updateFeatures', options.features);
    store.dispatch('updateLoading', options.suggestions ? false : true);
    if (options.rpcPort) this.rpc = new AppMapRPC(options.rpcPort);
  }

  update(update: Partial<ReviewRpc.Review>) {
    if (update.suggestions) store.dispatch('updateSuggestions', update.suggestions);
    if (update.features) store.dispatch('updateFeatures', update.features);
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
    explain.on('complete', () => store.dispatch('updateLoading', false));
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
