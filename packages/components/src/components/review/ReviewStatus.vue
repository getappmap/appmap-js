<template>
  <section id="summary" class="review-status">
    <div class="review-status__container">
      <SectionHeading title="Summary" :loading="loading" />
      <!-- <div class="review-status__header">
        <span
          v-if="isGreenStatus"
          class="review-status__icon review-status__icon--success"
          aria-label="All clear"
        >
          <check-circle />
        </span>
        <span
          v-else
          class="review-status__icon review-status__icon--warning"
          aria-label="Action needed"
        >
          <alert-triangle />
        </span>
        <h2 class="review-status__title">Summary</h2>
      </div> -->

      <div class="review-status__grid">
        <div class="review-status__card">
          <div class="review-status__card-header">
            <h3 class="review-status__card-title">Features</h3>
          </div>
          <div class="review-status__card-body" v-if="totalFeatures !== undefined">
            <p class="review-status__text">
              Total Features: <span class="review-status__value">{{ totalFeatures }}</span>
            </p>
            <p class="review-status__text">
              Features Needing Tests:
              <span class="review-status__value review-status__value--warning">{{
                featuresNeedingTests
              }}</span>
            </p>
          </div>
          <div v-else class="review-status__card-body">
            <v-loader class="v-loader" />
          </div>
        </div>

        <div class="review-status__card">
          <div class="review-status__card-header">
            <h3 class="review-status__card-title">
              Suggestions <v-loader class="v-loader" v-if="loading" />
            </h3>
          </div>
          <div class="review-status__card-body" v-if="suggestions !== undefined">
            <p class="review-status__text">
              High Priority:
              <span class="review-status__value review-status__value--error">{{
                suggestions.high
              }}</span>
            </p>
            <p class="review-status__text">
              Medium Priority:
              <span class="review-status__value review-status__value--warning">{{
                suggestions.medium
              }}</span>
            </p>
            <p class="review-status__text">
              Low Priority: <span class="review-status__value">{{ suggestions.low }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import SectionHeading from './SectionHeading.vue';
import VLoader from '@/components/chat/Loader.vue';

interface Suggestions {
  high: number;
  medium: number;
  low: number;
}

export default Vue.extend({
  name: 'ReviewStatus',
  components: {
    SectionHeading,
    VLoader,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    totalFeatures: {
      type: Number as PropType<number | undefined>,
      required: false,
    },
    featuresNeedingTests: {
      type: Number as PropType<number | undefined>,
      required: false,
    },
    dismissedFeatures: {
      type: Number as PropType<number | undefined>,
      required: false,
    },
    dismissedSuggestions: {
      type: Number as PropType<number | undefined>,
      required: false,
    },
    suggestions: {
      type: Object as PropType<Suggestions | undefined>,
      required: false,
    },
  },
  computed: {
    remainingTestsNeeded(): number | undefined {
      return this.featuresNeedingTests !== undefined && this.dismissedFeatures !== undefined
        ? this.featuresNeedingTests - this.dismissedFeatures
        : undefined;
    },
    totalHighMedium(): number | undefined {
      return this.suggestions?.high !== undefined && this.suggestions?.medium !== undefined
        ? this.suggestions.high + this.suggestions.medium
        : undefined;
    },
    remainingSuggestions(): number | undefined {
      return this.totalHighMedium !== undefined && this.dismissedSuggestions !== undefined
        ? this.totalHighMedium - this.dismissedSuggestions
        : undefined;
    },
    isGreenStatus(): boolean {
      return this.remainingTestsNeeded === 0 && this.remainingSuggestions === 0;
    },
  },
});
</script>

<style scoped lang="scss">
$text-xl-equivalent: 1.25rem;

.v-loader {
  display: inline-flex !important;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  width: 2ex !important;
  margin: 1ex;
  opacity: 0.2;
}

.review-status {
  font-family: $font-family;
  padding: 0 1rem;

  &__container {
    width: 100%;

    max-width: $max-width;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  &__icon {
    height: 1.5rem;
    width: 1.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.2rem;

    &--success {
      color: $color-success;
    }
    &--warning {
      color: $color-warning;
    }
  }

  &__title {
    font-size: $text-xl-equivalent;
    font-weight: 600;
    color: $color-foreground-light;
    margin: 0;
  }

  &__grid {
    display: grid;
    gap: 1.5rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__card {
    background-color: $color-tile-background;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  &__card-header {
    background-color: rgba(black, 0.05);
    padding: 0.5rem 1rem;
  }

  &__card-title {
    color: $color-foreground-light;
    font-weight: 600;
    font-size: $font-size;
    margin: 0;
  }

  &__card-body {
    padding: 0.75em;
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }

  &__text {
    color: $color-input-fg;
    font-size: $font-size;
    margin: 0;
  }

  &__value {
    font-weight: 500;
    color: $color-foreground-light;

    &--warning {
      color: $color-warning;
    }
    &--error {
      color: $color-error;
    }
  }
}
</style>
