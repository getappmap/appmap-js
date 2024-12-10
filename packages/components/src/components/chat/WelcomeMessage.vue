<template>
  <div class="welcome-message" data-cy="welcome-message">
    <div class="welcome-message-static">
      <h3>Hi, I'm Navie!</h3>
    </div>
    <div class="welcome-message-dynamic" v-if="dynamicMessage" v-html="renderedMarkdown" />
    <div class="welcome-message-dynamic-placeholder" v-else>Analyzing workspace...</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default Vue.extend({
  name: 'v-welcome-message',

  props: {
    staticMessage: {
      type: String,
      default: `### Hi, I'm Navie`,
    },
    dynamicMessage: {
      type: String,
      default: '',
    },
  },

  computed: {
    renderedMarkdown(): string {
      return DOMPurify.sanitize(marked.parse(this.dynamicMessage));
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
