<template>
  <div v-html="renderedMarkdown"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default defineComponent({
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
