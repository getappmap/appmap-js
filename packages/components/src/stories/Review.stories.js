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
  },
};

export const Review = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VReview },
  template: '<v-review v-bind="$props" ref="vsCode" />',
});

const chunkSize = 3;
const delay = 1000;
export function ReviewGradual(args, { argTypes }) {
  return {
    components: { VReview },
    data() {
      return {
        features: [],
        suggestions: [],
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
        if (this.suggestions.length < suggestions.length) {
          this.suggestions = suggestions.slice(0, this.suggestions.length + chunkSize);
          setTimeout(() => {
            this.nextChunk();
          }, delay);
        }
      },
    },
    computed: {
      loading() {
        return (
          this.suggestions.length < suggestions.length || this.features.length < features.length
        );
      },
    },
    template: '<v-review v-bind="$data" :loading="loading" />',
  };
}
