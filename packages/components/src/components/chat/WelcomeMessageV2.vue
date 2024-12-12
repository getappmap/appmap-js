<template>
  <div class="welcome-message" data-cy="welcome-message" data-version="2">
    <div class="welcome-message-static">
      <h3>Hi, I'm Navie!</h3>
    </div>
    <div class="welcome-message-dynamic" v-if="welcomeLoaded">
      <div v-if="welcomeMessage" v-html="renderedWelcomeMessage" class="welcome-message-text" />
      <div v-else-if="activityName" class="welcome-message-structured">
        <p>I see you're working on {{ activityName }}.</p>
        <p>Here are some suggestions for what you can do next:</p>
        <ul>
          <li v-for="suggestion in trimmedSuggestions" :key="suggestion">
            <a
              href="#"
              @click.prevent="onSuggestionClick(suggestion)"
              v-html="renderMarkdown(suggestion)"
            />
          </li>
        </ul>
      </div>
    </div>
    <div class="welcome-message__loading" data-cy="loading" v-else>
      <v-skeleton-loader />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import VSkeletonLoader from '@/components/SkeletonLoader.vue';

export default Vue.extend({
  name: 'v-welcome-message-v2',

  components: {
    VSkeletonLoader,
  },

  props: {
    welcomeMessage: {
      type: String,
    },
    activityName: {
      type: String,
    },
    suggestions: {
      type: Array<string>,
    },
    maxSuggestions: {
      type: Number,
      default: 3,
    },
  },

  computed: {
    welcomeLoaded(): boolean {
      return !!(this.welcomeMessage || this.activityName);
    },
    renderedWelcomeMessage(): string {
      return DOMPurify.sanitize(marked.parse(this.welcomeMessage));
    },
    trimmedSuggestions(): string[] {
      // First N suggestions
      return this.suggestions.slice(0, this.maxSuggestions);
    },
  },

  methods: {
    stripBackticks(markdown: string): string {
      return markdown.replace(/`+/g, '');
    },
    renderMarkdown(markdown: string): string {
      return DOMPurify.sanitize(marked.parse(markdown));
    },
    onSuggestionClick(suggestion: string) {
      this.$root.$emit('change-input', this.stripBackticks(suggestion));
    },
  },
});
</script>

<style lang="scss" scoped>
.welcome-message {
  line-height: 1.5;
  color: $white;
  max-height: 100%;
  overflow-y: auto;

  &::v-deep {
    code {
      background-color: rgba(black, 0.1);
      border-radius: 6px;
      border: 1px solid rgba(black, 0.05);
      padding: 0.1rem 0.25rem;
      padding-top: 0.2rem;
    }
  }

  &__loading {
    width: 100%;
    height: 10em;
    border-radius: $border-radius;
    overflow: hidden;
  }
}
</style>
