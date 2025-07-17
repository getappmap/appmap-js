<template>
  <div v-html="renderedMarkdown"></div>
</template>

<script lang="ts">
import Vue from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default Vue.extend({
  name: 'v-markdown',
  props: {
    content: {
      type: String,
      default: '',
    },
  },
  computed: {
    renderedMarkdown(): string {
      return DOMPurify.sanitize(marked.parse(this.content));
    },
  },
});
</script>
