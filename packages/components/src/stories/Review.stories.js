import { action } from '@storybook/addon-actions';

import VReview from '@/pages/Review.vue';
import { features, suggestions } from './data/review.json';
import './scss/fullscreen.scss';
import './scss/vscode.scss';

export default {
  title: 'Pages/Review',
  component: VReview,
  argTypes: {},
  args: {
    features,
    suggestions,
    loading: false,
  },
};

const events = ['open-location', 'open-appmap', 'fix'];

export const Review = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VReview },
  template: '<v-review v-bind="$props" ref="vsCode" />',
  created() {
    for (const event of events) this.$root.$on(event, action(event));
  },
});

const chunkSize = 3;
const delay = 1000;
export function ReviewGradual(args, { argTypes }) {
  return {
    components: { VReview },
    data() {
      return {
        features: undefined,
        suggestions: undefined,
      };
    },
    mounted() {
      setTimeout(() => {
        this.features = features;
        this.nextChunk();
      }, delay);
    },
    methods: {
      nextChunk() {
        if (this.suggestions?.length || 0 < suggestions.length) {
          this.suggestions = suggestions.slice(0, (this.suggestions?.length || 0) + chunkSize);
          setTimeout(() => {
            this.nextChunk();
          }, delay);
        }
      },
    },
    computed: {
      loading() {
        return !this.features || !this.suggestions || this.suggestions.length < suggestions.length;
      },
    },
    template: '<v-review v-bind="$data" :loading="loading" />',
  };
}
