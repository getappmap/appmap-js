import { action } from '@storybook/addon-actions';

import VReview from '@/pages/Review.vue';
import store from '@/store/review';
import { features, suggestions } from './data/review.json';
import './scss/fullscreen.scss';
import './scss/vscode.scss';

// Initialize the store with our test data
store.dispatch('updateFeatures', features);
store.dispatch('updateSuggestions', suggestions);
store.dispatch('updateLoading', false);

export default {
  title: 'Pages/Review',
  component: VReview,
  argTypes: {},
};

const events = ['open-location', 'open-appmap', 'fix'];

export const Review = (args, { argTypes }) => ({
  components: { VReview },
  template: '<v-review ref="vsCode" />',
  created() {
    for (const event of events) this.$root.$on(event, action(event));
  },
});

const chunkSize = 3;
const delay = 1000;
export function ReviewGradual(args, { argTypes }) {
  // Reset the store for this story
  store.dispatch('updateFeatures', undefined);
  store.dispatch('updateSuggestions', undefined);
  store.dispatch('updateLoading', true);

  return {
    components: { VReview },
    mounted() {
      setTimeout(() => {
        store.dispatch('updateFeatures', features);
        this.nextChunk();
      }, delay);
    },
    methods: {
      nextChunk() {
        const currentSuggestions = store.state.suggestions || [];
        if (currentSuggestions.length < suggestions.length) {
          store.dispatch(
            'updateSuggestions',
            suggestions.slice(0, currentSuggestions.length + chunkSize)
          );
          setTimeout(() => {
            this.nextChunk();
          }, delay);
        } else {
          store.dispatch('updateLoading', false);
        }
      },
    },
    template: '<v-review />',
  };
}
