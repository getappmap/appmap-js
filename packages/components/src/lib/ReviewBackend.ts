import type { ReviewRpc } from '@appland/rpc';

import type { Suggestion } from '@/components/review';
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
    if (options.rpcPort) {
      this.rpc = new AppMapRPC(options.rpcPort);
      review.$root.$on('fix', (suggestion: Suggestion) => this.startFix(suggestion));
    }
  }

  update(update: Partial<ReviewRpc.Review>) {
    if (update.suggestions) store.dispatch('updateSuggestions', update.suggestions);
    if (update.features) store.dispatch('updateFeatures', update.features);
    if (update.summary) store.dispatch('updateSummary', update.summary);
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
    let prompt = `@review /review2 /format=jsonl /nolabels /nofeatures`;
    if (baseRef) prompt += ` /base=${baseRef}`;
    console.log('Starting explain with prompt:', prompt);
    explain.explain(prompt);
    this.attach(explain);
  }

  async startFix(suggestion: Suggestion): Promise<string | undefined> {
    console.log('Starting fix for suggestion:', suggestion);
    if (!this.rpc) {
      console.error('RPC is not initialized');
      return undefined;
    }

    const registration = await this.rpc.register();
    const threadId = registration.thread.id;
    store.dispatch('setFixThread', { id: suggestion.id, threadId });

    const listener = await this.rpc.thread.subscribe(registration.thread.id);

    let issueDescription = '';
    if (suggestion.runtime?.finding) {
      const { finding } = suggestion.runtime;
      const req = finding?.event?.['http_server_request'];
      const query = finding?.event?.['sql_query'];
      const relatedClasses = new Set<string>(
        (finding.relatedEvents ?? []).map(({ defined_class, method }) => {
          if (method === undefined) {
            return defined_class;
          }
          return `${defined_class}#${method}`;
        })
      );
      issueDescription = [
        `The issue is described as "${suggestion.title}"`,
        finding.description,
        '\nDetails are as follows:',
        finding.message,
        finding.locationLabel,
        finding.event?.path,
        req && `${req.method} ${req.path}`,
        query && `SQL${query.database_type ? ` (${query.database_type})` : ''}: ${query.sql}`,
        ...[...relatedClasses],
        ...[...new Set(finding.stack.map((l: any) => l.replace(/:-1$/, '')))],
      ]
        .filter(Boolean)
        .join('\n');
    } else {
      issueDescription = [
        `${suggestion.title} in ${suggestion.location}:`,
        '```',
        suggestion.code,
        '```',
        suggestion.description,
      ].join('\n');
    }
    console.log('Issue description:', issueDescription);

    let resolver: () => void;
    listener.on('event', (e) => {
      if (e.type === 'message-complete') {
        if (resolver) resolver();
      }
    });
    const currentMessageComplete = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    this.rpc.thread.sendMessage(registration.thread.id, `@fix ${issueDescription}`);
    await currentMessageComplete;

    store.dispatch('fixReady', suggestion.id);
  }
}

export default ReviewBackend;
