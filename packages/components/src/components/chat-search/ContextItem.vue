<template>
  <div class="context__body__table-row" data-cy="context-item">
    <template v-if="isCodeSnippet">
      <v-markdown-code-snippet
        :language="language"
        :location="contextItem.location"
        :directory="contextItem.directory"
        :is-pinnable="false"
        >{{ contextItem.content }}</v-markdown-code-snippet
      >
    </template>
    <template v-else>
      <div
        class="context__body__table-row__header"
        data-cy="context-item-header"
        @click="openLocation"
      >
        <v-code-icon v-if="isCodeSnippet" class="row-icon" />
        <v-white-appmap-logo v-else class="row-icon" />
        <div class="row-text">{{ title }}</div>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import VCodeIcon from '@/assets/code-icon.svg';
import VWhiteAppmapLogo from '@/assets/jetbrains_run_config_execute_dark.svg';
import VMarkdownCodeSnippet from '@/components/chat/MarkdownCodeSnippet.vue';

export default Vue.extend({
  name: 'v-context-item',

  components: {
    VCodeIcon,
    VWhiteAppmapLogo,
    VMarkdownCodeSnippet,
  },

  props: {
    contextItem: {
      type: Object,
      required: true,
    },
  },

  computed: {
    language(): string {
      switch (this.contextItem.type) {
        case 'code-snippet':
          // Return the file extension, without line numbers
          return this.contextItem.location
            .replace(/:\d+(-\d+)?$/, '')
            .split('.')
            .pop();

        case 'sequence-diagram':
          return 'plantuml';

        case 'data-request':
          if (this.contextItem.content.startsWith('query:')) {
            return 'sql';
          }

        default:
          return 'plaintext';
      }
    },
    title(): string {
      if (this.contextItem.location) {
        if (this.contextItem.type === 'code-snippet') {
          return this.contextItem.location;
        } else {
          const appmapName = this.contextItem.location.split(/[\\/]/).pop();
          return appmapName.split('.').shift().replace(/_/g, ' ');
        }
      } else {
        // TODO: This should be CSS
        return this.contextItem.content;
      }
    },
    isCodeSnippet(): boolean {
      return this.contextItem.type === 'code-snippet';
    },
    isSequenceDiagram(): boolean {
      return this.contextItem.type === 'sequence-diagram';
    },
  },

  methods: {
    stripPrefix(text: string): string {
      // i.e. strip 'query: ' from 'query: SELECT * FROM table'
      return text.replace(/^[a-z]+:/, '');
    },
    openLocation() {
      if (this.contextItem.location) {
        this.$root.$emit('open-location', this.contextItem.location, this.contextItem.directory);
      }
    },
  },
});
</script>
<style lang="scss" scoped>
.context__body__table-row {
  &__header {
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 0.5em;
    padding: 0.65rem;
    cursor: pointer;
    height: 100%;

    .row-icon {
      width: 18px;
      align-self: end;
    }

    .row-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &:hover {
      background-color: rgba(200, 200, 255, 0.25) !important;
    }

    &.dark {
      background-color: rgba(0, 0, 0, 0.85);
    }
  }
}
</style>
