<template>
  <div class="review-page">
    <v-header />
    <v-markdown
      :class="{ md: 1, 'md--loading': loading, container: 1 }"
      v-if="summary"
      :content="summary"
    />
    <div class="toast-container" v-if="showToast">
      <v-flash-message :type="toastType" @click.native="toastAction">
        <p class="toast-message">{{ toastMessage }}</p>
      </v-flash-message>
    </div>
    <v-suggestions
      class="container"
      :suggestions="suggestions"
      :loading="loading"
      :includes-runtime-references="includesRuntimeReferences"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapGetters, mapActions } from 'vuex';

import VMarkdown from '@/components/Markdown.vue';
import VHeader from '@/components/review/Header.vue';
import VSuggestions from '@/components/review/Suggestions.vue';
import VFlashMessage from '@/components/FlashMessage.vue';
import store from '@/store/review';
import { Suggestion } from '@/components/review';

export default Vue.extend({
  name: 'ReviewPage',
  store,
  components: {
    VHeader,
    VSuggestions,
    VFlashMessage,
    VMarkdown,
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
    ...mapState(['features', 'dismissedFeatures', 'suggestions', 'loading', 'summary']),
    ...mapGetters(['totalFeatures', 'featuresNeedingTests', 'suggestionsSummary']),
    currentYear(): number {
      return new Date().getFullYear();
    },
    includesRuntimeReferences(): boolean {
      return this.$store.state.suggestions?.some((s: Suggestion) => Boolean(s.runtime));
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
.md {
  @keyframes skeleton {
    0% {
      background-position: -100% 0%;
    }
    100% {
      background-position: 100% 0%;
    }
  }

  &::v-deep {
    h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: bold;
      color: $color-foreground-light;
      &::after {
        display: block;
        content: ' ';
        background-color: $color-highlight;
        width: 5rem !important;
        height: 0.25rem !important;
        border-radius: 0.5rem;
        margin-top: 0.5rem;
      }
    }
  }

  &--loading {
    &::v-deep {
      h1::after {
        $alpha: 0.075;
        width: 100%;
        height: 100%;
        background-color: rgba(black, 0.1);
        background: linear-gradient(
          90deg,
          rgba(black, $alpha) 0%,
          rgba(white, $alpha) 50%,
          rgba(black, $alpha) 100%
        );
        background-size: 200% 100%;
        animation: skeleton 3s linear infinite;
      }
    }
  }
}

.container {
  width: 100%;
  max-width: 1080px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 2rem;
  padding-right: 2rem;
  box-sizing: border-box;
}

.review-page {
  min-height: 100vh;
  background-color: $color-background;
  color: $color-foreground-dark;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 2em;
  font-family: $font-family;
  font-size: $font-size;
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
