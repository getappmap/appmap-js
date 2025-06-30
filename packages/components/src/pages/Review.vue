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
    <div class="toast-container" v-if="showToast">
      <v-flash-message :type="toastType" @click.native="toastAction">
        <p class="toast-message">{{ toastMessage }}</p>
      </v-flash-message>
    </div>
    <v-feature-list :features="features" @feature-dismiss="dismissFeature" />
    <v-suggestions :suggestions="suggestions" :loading="loading" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapGetters, mapActions } from 'vuex';

import VHeader from '@/components/review/Header.vue';
import VReviewStatus from '@/components/review/ReviewStatus.vue';
import VFeatureList from '@/components/review/FeatureList.vue';
import VSuggestions from '@/components/review/Suggestions.vue';
import VFlashMessage from '@/components/FlashMessage.vue';
import store from '@/store/review';

export default Vue.extend({
  name: 'ReviewPage',
  store,
  components: {
    VHeader,
    VReviewStatus,
    VFeatureList,
    VSuggestions,
    VFlashMessage,
  },
  data() {
    return {
      showToast: false,
      toastMessage: '',
      toastType: 'info' as 'success' | 'error' | 'info',
      toastTimeout: null as number | null,
      toastAction: undefined as undefined | (() => void),
      storeWatcher: null as null | (() => void),
    };
  },
  computed: {
    ...mapState(['features', 'dismissedFeatures', 'suggestions', 'loading']),
    ...mapGetters(['totalFeatures', 'featuresNeedingTests', 'suggestionsSummary']),
    currentYear(): number {
      return new Date().getFullYear();
    },
  },
  mounted() {
    // Set up root event listener for fix event
    this.storeWatcher = store.subscribeAction({
      after: (action) => {
        if (action.type === 'setFixThread') {
          this.showToastNotification(
            `Navie started working on a fix in the background. You can review it later.`,
            'info',
            5000,
            () => this.onToastClick(action.payload.id)
          );
        } else if (action.type === 'fixReady') {
          this.showToastNotification(`Fix ready. Click to review and apply`, 'success', 5000, () =>
            this.onToastClick(action.payload)
          );
        }
      },
    });
  },
  beforeDestroy() {
    // Clean up the store watcher
    if (this.storeWatcher) {
      this.storeWatcher();
      this.storeWatcher = null;
    }
    // Clear any existing timeout
    if (this.toastTimeout !== null) {
      window.clearTimeout(this.toastTimeout);
    }
  },
  methods: {
    ...mapActions(['dismissFeature']),
    onToastClick(suggestionId: string) {
      const thread = this.$store.state.suggestionStatuses[suggestionId]?.threadId;
      if (thread) this.$root.$emit('show-navie-thread', thread);
      this.hideToast();
    },
    showToastNotification(
      message: string,
      type: 'success' | 'error' | 'info' = 'info',
      duration: number = 5000,
      action?: () => void
    ) {
      // Clear any existing timeout
      if (this.toastTimeout !== null) {
        window.clearTimeout(this.toastTimeout);
      }

      // Set toast properties
      this.toastMessage = message;
      this.toastType = type;
      this.showToast = true;
      this.toastAction = action ?? this.hideToast;

      // Hide toast after duration
      this.toastTimeout = window.setTimeout(() => {
        this.hideToast();
      }, duration);
    },
    hideToast() {
      this.showToast = false;
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
  background-color: $color-background;
  color: $color-foreground-dark;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2em;
}

.toast-message {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  white-space: pre-line;
}

.toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  max-width: 80em;
  cursor: pointer;
  animation: fadeIn 0.3s ease-in-out;
  box-shadow: $box-shadow-min;
  border-radius: $border-radius;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px) translateX(-50%);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
}
</style>
