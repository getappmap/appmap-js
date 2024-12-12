<template>
  <div class="welcome-message" data-cy="welcome-message">
    <div class="welcome-message-static">
      <h3>Hi, I'm Navie!</h3>
    </div>
    <div class="welcome-message-dynamic" v-if="welcomeLoaded">
      <div v-if="welcomeMessage" v-html="welcomeMessage" class="welcome-message-text" />
      <div v-else-if="activityName" class="welcome-message-structured">
        <p>I see you're working on {{ activityName }}. Here are some things you can try:</p>
        <ul>
          <li v-for="suggestion in trimmedSuggestions" :key="suggestion">
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>
    <div class="welcome-message-dynamic-placeholder" v-else>Analyzing workspace...</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default Vue.extend({
  name: 'v-welcome-message-v2',

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
    renderedDynamicMessage(): string {
      return DOMPurify.sanitize(marked.parse(this.welcomeMessage));
    },
    trimmedSuggestions(): string[] {
      // First N suggestions
      return this.suggestions.slice(0, this.maxSuggestions);
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

  .welcome-message-dynamic-placeholder {
    $alpha: 0.075;
    width: 100%;
    height: 1.5rem;
    border-radius: $border-radius;
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
</style>
