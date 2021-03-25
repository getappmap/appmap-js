<template>
  <div class="source-code">
    <pre class="source-code__comment" v-if="comment">{{ comment }}</pre>
    <pre class="source-code__source" v-html="sourceCode">{{ sourceCode }}</pre>
  </div>
</template>

<script>
import hljs from 'highlight.js';

export default {
  name: 'v-source-code',

  props: {
    comment: {
      type: String,
      required: false,
    },
    source: {
      type: String,
      required: true,
    },
  },

  computed: {
    sourceCode() {
      const leadSpacesCount = this.source.search(/\S/);
      const source = this.source
        .split('\n')
        .map((line) => line.substring(leadSpacesCount))
        .join('\n');
      return hljs.highlightAuto(source).value;
    },
  },
};
</script>

<style scoped lang="scss">
.source-code {
  margin: 1rem 0;
  border-bottom: 1px solid $base15;
  padding: 0 2rem 1rem;
  line-height: 1.2;

  &__comment,
  &__source {
    margin: 0;
  }

  &__comment {
    opacity: 0.5;
  }
}
</style>
