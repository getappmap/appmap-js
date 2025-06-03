<template>
  <div class="review-page">
    <v-header />

    <v-review-status
      :total-features="totalFeatures"
      :features-needing-tests="featuresNeedingTests"
      :dismissed-features="dismissedFeatures.length"
      :suggestions="suggestionsSummary"
      :dismissed-suggestions="dismissedSuggestions.length"
    />

    <main>
      <v-feature-list @feature-dismiss="handleFeatureDismiss" />
      <v-suggestions @suggestion-dismiss="handleSuggestionDismiss" :suggestions="suggestions" />
    </main>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VHeader from '@/components/review/Header.vue';
import VReviewStatus from '@/components/review/ReviewStatus.vue';
import VFeatureList from '@/components/review/FeatureList.vue';
import VSuggestions from '@/components/review/Suggestions.vue';

interface Feature {
  name: string;
  hasCoverage: boolean;
}

export default Vue.extend({
  name: 'ReviewPage',
  components: {
    VHeader,
    VReviewStatus,
    VFeatureList,
    VSuggestions,
  },
  props: {
    features: {
      type: Array as PropType<Feature[]>,
      default: () => [],
    },
    suggestions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      dismissedFeatures: [] as number[],
      dismissedSuggestions: [] as string[],
      suggestionsSummary: {
        high: 5,
        medium: 7,
        low: 2,
      },
    };
  },
  computed: {
    totalFeatures(): number {
      return this.features.length;
    },
    featuresNeedingTests(): number {
      return this.features.filter((f) => !f.hasCoverage).length;
    },
    currentYear(): number {
      return new Date().getFullYear();
    },
  },
  methods: {
    handleFeatureDismiss(index: number) {
      if (!this.dismissedFeatures.includes(index)) {
        this.dismissedFeatures.push(index);
      }
    },
    handleSuggestionDismiss(id: string) {
      if (!this.dismissedSuggestions.includes(id)) {
        this.dismissedSuggestions.push(id);
      }
    },
  },
});
</script>

<style scoped lang="scss">
.review-page {
  min-height: 100vh;
  background-color: $color-input-bg;
  color: $color-foreground-dark;
}
</style>
