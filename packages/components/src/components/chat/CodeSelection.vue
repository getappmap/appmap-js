<template>
  <v-accordion
    :open="open"
    :class="{ 'code-selection': 1, 'code-selection--open': open }"
    :data-uri="uri"
    data-cy="code-selection"
  >
    <template #header>
      <div
        data-cy="code-selection-header"
        :class="{ 'code-selection__header': 1, 'code-selection__header--no-content': !content }"
        @click="onClick"
      >
        <v-document />
        <div class="code-selection__title" data-cy="title">{{ title }}</div>
      </div>
    </template>
    <pre v-html="highlightedCode" data-cy="code-selection-content" class="hljs" />
  </v-accordion>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import hljs from 'highlight.js';
import VAccordion from '@/components/Accordion.vue';
import VDocument from '@/assets/document.svg';
import { URI } from '@appland/rpc';

export default Vue.extend({
  name: 'v-code-selection',
  components: {
    VAccordion,
    VDocument,
  },
  props: {
    uri: String as PropType<string | undefined>,
    content: String as PropType<string | undefined>,
    language: String as PropType<string | undefined>,
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
    uriComponents(): URI | undefined {
      if (this.uri) {
        try {
          return URI.parse(this.uri);
        } catch (e) {
          console.error('Invalid URI:', this.uri, e);
        }
      }
      return undefined;
    },
    path(): string | undefined {
      return this.uriComponents?.fsPath;
    },
    range(): string | undefined {
      const range = this.uriComponents?.range;
      return range ? [range.start, range.end].filter(Boolean).join('-') : undefined;
    },
    fileExtension(): string | undefined {
      if (!this.path) return;

      return this.path.match(/\.(\w+)$/)?.[1];
    },
    highlightedCode(): string {
      let language = this.language ?? this.fileExtension;
      if (!language || !hljs.getLanguage(language)) {
        language = 'plaintext';
      }
      return hljs.highlight(this.content ?? '', { language }).value;
    },
    fileName(): string | undefined {
      if (!this.path) return;
      return this.path.split(/[\\/]/).pop();
    },
    title(): string {
      if (!this.fileName) return 'Code snippet';
      return [this.fileName, this.range].filter(Boolean).join(':');
    },
  },
  methods: {
    onClick() {
      if (!this.content) return;
      this.open = !this.open;
    },
  },
});
</script>

<style lang="scss" scoped>
.code-selection {
  color: $color-foreground;
  width: 100%;

  &__title {
    padding-top: 2px;
  }

  &__header {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 0.25em;
    font-size: 0.9em;
    padding: 0.2em;

    &--no-content {
      cursor: initial;
      user-select: text;
      &:hover {
        color: $color-foreground !important;
        svg,
        path {
          fill: $color-foreground !important;
        }
      }
    }

    svg,
    path {
      width: 1em;
      height: 1em;
      fill: $color-foreground;
      overflow: visible;
    }

    &:hover {
      color: $color-highlight;
      svg,
      path {
        fill: $color-highlight;
      }
    }
  }

  &--open {
    background-color: $color-background;
    border: 1px solid $color-border;
    border-radius: $border-radius;
    .code-selection__header {
      padding: 0.5em 1em;
      background-color: rgba(black, 0.2);
    }
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
