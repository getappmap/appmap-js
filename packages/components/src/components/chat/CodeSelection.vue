<template>
  <v-accordion
    :open="open"
    :class="{ 'code-selection': 1, 'code-selection--open': open }"
    data-cy="code-selection"
  >
    <template #header>
      <v-tool-status
        complete-icon="document"
        :title="title"
        :status="subTitle"
        :complete="true"
        @click.native="open = !open"
        :class="{ 'tool-status--open': open }"
        :interactive="true"
      />
    </template>
    <pre v-html="highlightedCode" data-cy="code-selection-content" class="hljs" />
  </v-accordion>
</template>

<script lang="ts">
import Vue from 'vue';
import hljs from 'highlight.js';
import VAccordion from '@/components/Accordion.vue';
import VToolStatus from '@/components/chat/ToolStatus.vue';

// Array.prototype.findLastIndex polyfill
function findLastIndex<T>(
  array: T[],
  predicate: (value: T, index: number, obj: T[]) => boolean
): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) {
      return i;
    }
  }
  return -1;
}

export default Vue.extend({
  name: 'v-code-selection',
  components: {
    VAccordion,
    VToolStatus,
  },
  props: {
    path: String,
    lineStart: Number,
    lineEnd: Number,
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
    },
  },
  inject: {
    theme: {
      default: 'dark',
    },
  },
  data() {
    return {
      open: false,
    };
  },
  computed: {
    highlightedCode(): string {
      let language = this.language;
      if (!language && this.path) {
        // Attempt to get the language from the file extension
        const lastDot = this.path.lastIndexOf('.');
        language = this.path.slice(lastDot + 1);
      }

      if (!hljs.getLanguage(language)) {
        language = 'plaintext';
      }

      return hljs.highlight(this.code, { language }).value;
    },
    lineRange(): string {
      if (this.lineStart !== 0 && !this.lineStart) return '';

      if (this.lineStart === this.lineEnd || !this.lineEnd) {
        return `:${this.lineStart}`;
      }

      return `:${this.lineStart}-${this.lineEnd}`;
    },
    title(): string {
      if (!this.path) return 'Code snippet';

      const lastSeparator = findLastIndex([...this.path], (c) => c === '/' || c === '\\');
      const fileName = this.path.slice(lastSeparator + 1);

      return `${fileName}${this.lineRange}`;
    },
    subTitle(): string {
      return this.path ? this.path : `Click to ${this.open ? 'hide' : 'expand'}`;
    },
  },
});
</script>

<style lang="scss" scoped>
.code-selection {
  color: $color-foreground;

  &--open {
    background-color: $color-background;
    border: 1px solid $color-border;
    border-radius: $border-radius;
  }
  pre {
    max-height: 18rem;
    padding: 1rem;
    overflow: auto;
    margin: 0;
    border: none;
    padding-top: 5px;
    border-radius: 0 0 $border-radius $border-radius;
  }

  .tool-status--open {
    width: auto;
    border-radius: $border-radius $border-radius 0 0;
    background-color: rgba(black, 0.4);
  }
}
</style>
