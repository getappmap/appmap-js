<template>
  <div class="welcome-message" data-cy="welcome-message" v-html="renderedMarkdown" v-if="message" />
</template>

<script lang="ts">
import Vue from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default Vue.extend({
  name: 'v-welcome-message',

  props: {
    message: {
      type: String,
      default: '',
    },
  },

  computed: {
    renderedMarkdown(): string {
      return DOMPurify.sanitize(marked.parse(this.message));
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
}
</style>
