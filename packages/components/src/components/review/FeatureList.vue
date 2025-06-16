<template>
  <section id="features" class="feature-list">
    <div class="feature-list__container">
      <v-section-heading title="Features" :loading="loading" />

      <!-- Test Status Section -->
      <div class="feature-list__actions">
        <v-button @click="runTests" :disabled="isRunningTests" kind="native-ghost">
          <template v-if="isRunningTests">
            <v-rotate-cw :size="14" class="button-icon" />
            Running Tests...
          </template>
          <template v-else>
            <v-play :size="14" class="button-icon" />
            Run Tests
          </template>
        </v-button>
      </div>

      <!-- Features Grid -->
      <div class="feature-list__grid">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="feature-list__card"
          :class="{
            'feature-list__card--needs-tests': !feature.hasCoverage && !isFeatureDismissed(index),
          }"
        >
          <div class="feature-list__card-content">
            <span
              v-if="feature.hasCoverage || isFeatureDismissed(index)"
              class="feature-list__icon feature-list__icon--success feature-list__icon--feature-status"
              aria-label="Covered or Dismissed"
            >
              <v-check />
            </span>
            <span
              v-else
              class="feature-list__icon feature-list__icon--warning feature-list__icon--feature-status"
              aria-label="Needs Coverage"
            >
              <v-triangle-alert />
            </span>
            <div class="feature-list__card-details">
              <p class="feature-list__text">{{ feature.description }}</p>

              <button
                v-if="feature.hasCoverage && testsStarted"
                @click="toggleTestDetails(index)"
                class="feature-list__button feature-list__button--link feature-list__toggle-details"
              >
                <span class="feature-list__icon" aria-hidden="true">{{
                  expandedTests.includes(index) ? '▲' : '▼'
                }}</span>
                {{ expandedTests.includes(index) ? 'Hide' : 'Show' }} test details
              </button>

              <div
                v-if="feature.hasCoverage && testsStarted && expandedTests.includes(index)"
                class="feature-list__collapsible-content"
              >
                <div class="feature-list__collapsible-header">
                  <div class="feature-list__test-meta">
                    <p>File: {{ feature.testDetails && feature.testDetails.file }}</p>
                    <p>Location: {{ feature.testDetails && feature.testDetails.location }}</p>
                  </div>
                  <button
                    v-if="hasFailedTests(feature)"
                    @click="retestFeature(index)"
                    :disabled="retestingFeature === index"
                    class="feature-list__button feature-list__button--sm feature-list__button--primary"
                  >
                    <template v-if="retestingFeature === index">
                      <span
                        class="feature-list__icon feature-list__icon--loader animate-spin"
                        aria-hidden="true"
                        >↻</span
                      >
                      Retesting...
                    </template>
                    <template v-else>
                      <span class="feature-list__icon" aria-hidden="true">🔄</span>
                      Retest
                    </template>
                  </button>
                </div>
                <div class="feature-list__test-summary-list">
                  <div
                    v-for="(test, testIdx) in feature.testDetails ? feature.testDetails.tests : []"
                    :key="`summary-${testIdx}`"
                    class="feature-list__test-summary-item"
                  >
                    <span
                      v-if="test.status === 'pass'"
                      class="feature-list__icon feature-list__icon--success feature-list__icon--xs"
                      aria-label="Pass"
                      >✓</span
                    >
                    <span
                      v-else
                      class="feature-list__icon feature-list__icon--error feature-list__icon--xs"
                      aria-label="Fail"
                      >✗</span
                    >
                    <span class="feature-list__test-summary-name">{{ test.name }}</span>
                    <span v-if="test.message" class="feature-list__test-summary-message"
                      >- {{ test.message }}</span
                    >
                  </div>
                </div>
              </div>

              <div
                v-if="!feature.hasCoverage && !isFeatureDismissed(index)"
                class="feature-list__collapsible-content feature-list__collapsible-content--warning"
              >
                <div class="feature-list__no-coverage-header">
                  <p class="feature-list__no-coverage-text">⚠️ No test coverage found</p>
                  <button
                    @click="handleShowDismissDialog(index)"
                    class="feature-list__button feature-list__button--link feature-list__button--subtle"
                  >
                    Dismiss
                  </button>
                </div>
                <p class="feature-list__ai-prompt-label">
                  Suggested AI prompt for generating tests:
                </p>
                <pre class="feature-list__ai-prompt">{{ feature.aiPrompt }}</pre>
              </div>

              <div
                v-if="
                  isFeatureDismissed(index) &&
                  getDismissedReason(index) &&
                  showDismissedReasonDialog === index
                "
                class="feature-list__collapsible-content"
              >
                <p>{{ getDismissedReason(index) }}</p>
              </div>
              <!-- Add a button to toggle dismissed reason visibility if needed, React version didn't have explicit toggle for already dismissed items -->
            </div>
          </div>
        </div>
        <v-skeleton-loader class="feature-list__card-loader" v-if="loading" />
      </div>

      <v-dismiss-modal
        v-if="showDismissDialog"
        title="Why are tests not needed?"
        placeholder="Enter your reason for dismissing testing of this feature..."
        @close="closeDismissDialog"
        @submit="submitDismissReason"
      />
    </div>
  </section>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VSectionHeading from '@/components/review/SectionHeading.vue';
import VDismissModal from '@/components/review/DismissModal.vue';
import VButton from '@/components/Button.vue';
import VSkeletonLoader from '@/components/SkeletonLoader.vue';
import {
  Check as VCheck,
  TriangleAlert as VTriangleAlert,
  Play as VPlay,
  RotateCw as VRotateCw,
} from 'lucide-vue';
import type { Test, Feature, DismissedFeature } from '.';

export default Vue.extend({
  name: 'FeatureList',
  components: {
    VSectionHeading,
    VCheck,
    VTriangleAlert,
    VDismissModal,
    VButton,
    VPlay,
    VRotateCw,
    VSkeletonLoader,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    features: {
      type: Array as PropType<Feature[]>,
      required: true,
    },
  },
  data() {
    return {
      expandedTests: [] as number[],
      dismissedFeatures: [] as DismissedFeature[],
      showDismissDialog: null as number | null,
      showDismissedReasonDialog: null as number | null, // For viewing reason of an already dismissed item
      isRunningTests: false,
      testsStarted: false,
      retestingFeature: null as number | null,
    };
  },
  computed: {},
  methods: {
    toggleTestDetails(index: number) {
      const existingIndex = this.expandedTests.indexOf(index);
      if (existingIndex > -1) {
        this.expandedTests.splice(existingIndex, 1);
      } else {
        this.expandedTests.push(index);
      }
    },
    handleShowDismissDialog(index: number) {
      this.showDismissDialog = index;
    },
    closeDismissDialog() {
      this.showDismissDialog = null;
    },
    submitDismissReason(reason: string) {
      if (this.showDismissDialog !== null) {
        this.dismissedFeatures.push({
          index: this.showDismissDialog,
          reason,
        });
        this.$emit('feature-dismiss', this.showDismissDialog);
        this.closeDismissDialog();
      }
    },
    isFeatureDismissed(index: number): boolean {
      return this.dismissedFeatures.some((df) => df.index === index);
    },
    getDismissedReason(index: number): string | undefined {
      const dismissed = this.dismissedFeatures.find((df) => df.index === index);
      return dismissed?.reason;
    },
    // For toggling visibility of an already dismissed item's reason (if needed)
    // toggleShowDismissedReason(index: number) {
    //   this.showDismissedReasonDialog = this.showDismissedReasonDialog === index ? null : index;
    // },
    async runTests() {
      this.isRunningTests = true;
      this.testsStarted = false; // Reset if re-running
      await new Promise((resolve) => setTimeout(resolve, 1500));
      this.isRunningTests = false;
      this.testsStarted = true;
      // In a real app, you'd update feature.testDetails based on actual test results
    },
    async retestFeature(index: number) {
      this.retestingFeature = index;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      this.retestingFeature = null;
      // In a real app, you'd update the specific feature's testDetails
      // For example, find a failed test and mark it as pass
      const feature = this.features[index];
      if (feature && feature.testDetails) {
        const failedTest = feature.testDetails.tests.find((t) => t.status === 'fail');
        if (failedTest) {
          // This is a mock update.
          // Vue.set(failedTest, 'status', 'pass');
          // Vue.delete(failedTest, 'message');
          // Or for a more robust update if objects are nested deeply:
          const testIdx = feature.testDetails.tests.findIndex((t) => t.status === 'fail');
          if (testIdx !== -1) {
            const updatedTest = {
              ...feature.testDetails.tests[testIdx],
              status: 'pass' as 'pass' | 'fail',
              message: undefined,
            };
            this.$set(this.features[index].testDetails!.tests, testIdx, updatedTest);
          }
        }
      }
    },
    hasFailedTests(feature: Feature): boolean {
      return feature.testDetails?.tests.some((test) => test.status === 'fail') || false;
    },
    handleFixTest(feature: Feature, test: Test) {
      // Placeholder for "Fix Test" button logic
      console.log('Attempting to fix test:', test.name, 'in feature:', feature.description);
      alert(`"Fix Test" clicked for: ${test.name}`);
    },
  },
});
</script>

<style scoped lang="scss">
// Basic spinner animation
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin {
  animation: spin 1s linear infinite;
}

.button-icon {
  padding-right: 0.5em;
}

.feature-list {
  font-family: $font-family;

  &__container {
    max-width: $max-width;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  &__test-status-section {
    background-color: $color-tile-background;
    border-radius: 0.5rem;
    padding: 1.5rem;
    border: 1px solid $color-border;
  }

  &__test-status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  &__sub-heading {
    font-size: 1.125rem;
    font-weight: 600;
    color: $color-foreground-light;
    margin: 0;
  }

  &__button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: $border-radius;
    transition: background-color 0.2s, color 0.2s, opacity 0.2s;
    font-weight: 500;
    cursor: pointer;
    border: none;

    &--primary {
      background-color: $color-highlight;
      color: $color-button-fg;
      &:hover {
        background-color: $color-highlight-light;
      }
      &:disabled {
        background-color: $color-highlight-dark;
        cursor: not-allowed;
      }
    }
    &--secondary {
      background-color: $color-background-light;
      color: $color-foreground-dark;
      &:hover {
        background-color: rgba(white, 0.05);
        color: $color-foreground-light;
      }
    }
    &--link {
      background-color: transparent;
      padding: 0.25rem 0.1rem;
      color: $color-link;
      font-size: 0.875rem;
      &:hover {
        color: $color-link-hover;
        text-decoration: underline;
      }
    }
    &--subtle {
      background-color: transparent;
      padding: 0.25rem 0.5rem;
      color: $color-foreground-secondary;
      font-size: 0.875rem;
      border-radius: $border-radius;
      &:hover {
        color: $color-foreground-dark;
        background-color: $color-background-light;
      }
    }
    &--xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      gap: 0.25rem;
      .feature-list__icon {
        height: 0.75rem;
        width: 0.75rem;
      }
    }
    &--danger-ghost {
      background-color: rgba($color-error, 0.1);
      color: $color-error;
      &:hover {
        background-color: rgba($color-error, 0.2);
      }
    }
    &--sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .feature-list__icon--loader {
      height: 1rem;
      width: 1rem;
    }
  }

  &__test-results-container {
    > *:not(:last-child) {
      margin-bottom: 0.75rem;
    }
  }
  &__test-group {
    > *:not(:last-child) {
      margin-bottom: 0.5rem;
    }
  }

  &__test-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background-color: $color-input-bg;
    padding: 0.75rem;
    border-radius: $border-radius;
  }

  &__icon {
    display: inline-block;
    flex-shrink: 0;

    &--test-status {
      height: 1.25rem;
      width: 1.25rem;
      margin-top: 2px;
      font-size: 1rem;
      line-height: 1.25rem;
      text-align: center;
    }
    &--feature-status {
      height: 1.5rem;
      width: 1.5rem;
      margin-top: 2px;
      font-size: 1.1rem;
      line-height: 1.5rem;
      text-align: center;
    }
    &--xs {
      height: 1rem;
      width: 1rem;
      font-size: 0.8rem;
      line-height: 1rem;
    }

    &--success {
      color: $color-success;
    }
    &--error {
      color: $color-error;
    }
    &--warning {
      color: $color-warning;
    }
  }

  &__test-item-details {
    flex: 1;
    min-width: 0;
  }
  &__test-item-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  &__test-name {
    font-weight: 500;
    font-size: 0.875rem;
  }
  &__test-file-info {
    color: $color-foreground-secondary;
    font-size: 0.875rem;
  }
  &__test-message {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: $color-error;
  }

  &__no-tests-placeholder {
    text-align: center;
    padding: 2rem 0;
    color: $color-foreground-secondary;
  }

  &__grid {
    display: grid;
    gap: 1rem;
  }

  &__card {
    background-color: $color-tile-background;
    border-radius: 0.5rem;
    padding: 1rem;
    border-left: 4px solid $color-highlight;

    &--needs-tests {
      border-left-color: $color-warning;
    }
  }

  &__card-loader {
    height: 8em !important;
    width: 100%;
    border-radius: $border-radius;
  }

  &__card-content {
    display: flex;
    gap: 0.75rem;
  }
  &__card-details {
    flex: 1;
  }
  &__text {
    color: $color-input-fg;
    margin-top: 0.33rem;
    margin-bottom: 0.5rem;
  }
  &__toggle-details {
    margin-top: 0.5rem;
    .feature-list__icon {
      height: 1rem;
      width: 1rem;
    }
  }

  &__collapsible-content {
    margin-top: 0.5rem;
    background-color: $color-background-dark;
    border-radius: $border-radius;
    padding: 0.75rem;
    border: 1px solid $color-border;
  }
  &__collapsible-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }
  &__test-meta {
    font-family: monospace;
    font-size: 0.875rem;
    color: $color-foreground-secondary;
    > *:not(:last-child) {
      margin-bottom: 0.5rem;
    }
  }
  &__test-summary-list {
    > *:not(:last-child) {
      margin-bottom: 0.25rem;
    }
  }
  &__test-summary-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: monospace;
    font-size: 0.875rem;
    color: $color-foreground-secondary;
  }

  &__test-summary-message {
    color: $color-error;
  }

  &__no-coverage-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }
  &__no-coverage-text {
    font-size: 0.875rem;
    color: $color-warning;
    margin-right: 0.5rem;
  }
  &__ai-prompt-label {
    font-size: 0.875rem;
    color: $color-foreground-dark;
    margin-bottom: 0.5rem;
  }
  &__ai-prompt {
    font-size: 0.75rem;
    color: $color-foreground-secondary;
    font-family: monospace;
    white-space: pre-wrap;
    background-color: rgba(black, 0.03);
    padding: 0.5rem;
    border-radius: $border-radius;
  }

  &__modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(black, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 50;
  }

  &__modal-content {
    background-color: $color-tile-background;
    border-radius: 0.5rem;
    padding: 1.5rem;
    max-width: 500px;
    width: 100%;
    box-shadow: $shadow-tile;
  }

  &__modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: $color-foreground-light;
    margin-bottom: 1rem;
  }

  &__modal-textarea {
    width: 100%;
    min-height: 8rem;
    background-color: $color-input-bg;
    color: $color-input-fg;
    border-radius: $border-radius;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid $color-border;
    font-family: $font-family;
    font-size: $font-size;
    &:focus {
      outline: none;
      border-color: $color-highlight;
    }
  }

  &__modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
}
</style>
