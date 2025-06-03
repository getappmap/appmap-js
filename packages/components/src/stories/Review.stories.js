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
