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
      <v-flash-message :type="toastType" @click="hideToast">
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
    this.storeWatcher = this.$store.subscribeAction({
      after: (action, state) => {
        console.log(`Action dispatched: ${action.type}`, action.payload);
        if (action.type === 'setFixThread') {
          this.showToastNotification(
            `Navie started working on a fix in the background.\nCheck the progress by clicking the button again.`,
            'info'
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
    showToastNotification(
      message: string,
      type: 'success' | 'error' | 'info' = 'info',
      duration: number = 5000
    ) {
      // Clear any existing timeout
      if (this.toastTimeout !== null) {
        window.clearTimeout(this.toastTimeout);
      }

      this.toastMessage = message;
      this.toastType = type;
      this.showToast = true;

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
