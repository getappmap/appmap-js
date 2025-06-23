<template>
  <div class="review-page">
    <v-header />
    <v-review-status
      :total-features="totalFeatures"
      :features-needing-tests="featuresNeedingTests"
      :dismissed-features="dismissedFeatures.length"
      :suggestions="suggestionsSummary"
      :loading="loading"
    />
    <v-feature-list :features="features" @feature-dismiss="dismissFeature" />
    <v-suggestions
      :suggestions="suggestions"
      :loading="loading"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapGetters, mapActions } from 'vuex';

import VHeader from '@/components/review/Header.vue';
import VReviewStatus from '@/components/review/ReviewStatus.vue';
import VFeatureList from '@/components/review/FeatureList.vue';
import VSuggestions from '@/components/review/Suggestions.vue';
import store from '@/store/review';

export default Vue.extend({
  name: 'ReviewPage',
  store,
  components: {
    VHeader,
    VReviewStatus,
    VFeatureList,
    VSuggestions,
  },
  computed: {
    ...mapState(['features', 'dismissedFeatures', 'suggestions', 'loading']),
    ...mapGetters(['totalFeatures', 'featuresNeedingTests', 'suggestionsSummary']),
    currentYear(): number {
      return new Date().getFullYear();
    },
  },
  methods: {
    ...mapActions(['dismissFeature']),
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
  background-color: $color-background;
  color: $color-foreground-dark;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2em;
}
</style>
