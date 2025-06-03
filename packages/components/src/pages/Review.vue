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
    <v-feature-list :features="features" @feature-dismiss="handleFeatureDismiss" />
    <v-suggestions @suggestion-dismiss="handleSuggestionDismiss" :suggestions="suggestions" />
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VHeader from '@/components/review/Header.vue';
import VReviewStatus from '@/components/review/ReviewStatus.vue';
import VFeatureList from '@/components/review/FeatureList.vue';
import VSuggestions from '@/components/review/Suggestions.vue';
import type { Feature, Suggestion } from '@/components/review';

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
      type: Array as PropType<Suggestion[]>,
      default: () => [],
    },
    testCoverageItems: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      dismissedFeatures: [] as number[],
      dismissedSuggestions: [] as string[],
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
    suggestionsSummary(): { high: number; medium: number; low: number } {
      const summary = { high: 0, medium: 0, low: 0 };
      if (Array.isArray(this.suggestions)) {
        for (const suggestion of this.suggestions) {
          if (suggestion.priority === 'high') {
            summary.high++;
          } else if (suggestion.priority === 'medium') {
            summary.medium++;
          } else if (suggestion.priority === 'low') {
            summary.low++;
          }
        }
      }
      return summary;
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

<style lang="scss">
@import '~highlight.js/styles/base16/snazzy.css';
a {
  color: $color-link;
  text-decoration: none;

  &:hover {
    color: $color-link-hover;
    text-decoration: underline;
  }
}
</style>

<style scoped lang="scss">
.review-page {
  min-height: 100vh;
  background-color: $color-input-bg;
  color: $color-foreground-dark;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2em;
}
</style>
