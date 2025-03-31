<template>
  <div class="pinned-items" data-cy="pinned-items">
    <template v-if="!hasPinnedItems">
      <div class="pinned-items__notice-container">
        <div data-cy="pinned-items-notice">
          <component :is="getNoticeComponent()" />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="pinned-items__body">
        <div class="pinned-items__body__table">
          <component
            v-for="pin in pinnedItems"
            :is="getPinnedComponent(pin.uri)"
            :is-reference="true"
            :key="pin.uri"
            :uri="pin.uri"
            v-bind="getMetadata(pin)"
            class="pinned-items__pinned-item"
            @pin="unpin(pin.uri)"
            >{{ getPinnedContent(pin.uri).content }}</component
          >
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VFile from '@/components/chat/File.vue';
import VMarkdownCodeSnippet from '@/components/chat/MarkdownCodeSnippet.vue';
import VMermaidDiagram from '@/components/chat/MermaidDiagram.vue';
import VVSCodeNotice from '@/components/chat-search/VSCodeNotice.vue';
import VIntelliJNotice from '@/components/chat-search/IntelliJNotice.vue';
import { pinnedItemRegistry } from '@/lib/pinnedItems';

const EditorNoticeComponents = {
  vscode: VVSCodeNotice,
  intellij: VIntelliJNotice,
};

export default {
  name: 'v-pinned-items',

  components: {
    VFile,
    VIntelliJNotice,
    VMarkdownCodeSnippet,
    VMermaidDiagram,
    VVSCodeNotice,
  },

  props: {
    editorType: {
      type: String,
      default: 'vscode',
    },
    pinnedItems: {
      type: Array,
      required: false,
    },
  },

  computed: {
    hasPinnedItems() {
      return this.pinnedItems?.length > 0;
    },
  },

  methods: {
    getNoticeComponent(): Vue.Component {
      return EditorNoticeComponents[this.editorType];
    },
    getPinnedComponent(uri: string): Vue.Component | undefined {
      const pinnedItem = pinnedItemRegistry.get(uri);

      // If it's not registered, it's an external file.
      if (!pinnedItem) return VFile;

      const language = pinnedItem.metadata?.language;
      if (language === 'mermaid') return VMermaidDiagram;
      return VMarkdownCodeSnippet;
    },
    getPinnedContent(uri: string): ObservableContent {
      return pinnedItemRegistry.get(uri) ?? {};
    },
    getMetadata(pinnedItem: PinnedItem): Record<string, unknown> {
      const registryItem = pinnedItemRegistry.get(pinnedItem.uri);
      return registryItem?.metadata ?? pinnedItem;
    },
    unpin(uri: string) {
      this.$emit('pin', { uri, pinned: false });
    },
  },
};
</script>

<style lang="scss" scoped>
.pinned-items {
  width: 100%;
  min-height: 100%;

  &__pinned-item {
    box-shadow: none;
    margin: 0;
    &::v-deep {
      .context-container {
        margin: 0;
      }
    }
  }

  &__count {
    font-size: 0.8rem;
    font-weight: 400;
    margin-left: 0.5rem;
    background-color: rgb(168, 168, 255, 0.15);
    border-radius: 4rem;
    width: 1.25rem;
    height: 1.25rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }

  h2 {
    margin-top: 0;
    margin-bottom: 2rem;
    color: $white;
  }

  &__header {
    flex: none;
    padding: 1rem;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  &__body {
    padding: 1rem;
    overflow-y: auto;

    &__table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
  }

  &__notice-container {
    display: flex;
    flex-direction: column;
    height: fit-content;
    margin: 1rem 2rem;
    margin-bottom: 0;
  }

  &__notice {
    margin: 0 auto;
    width: 80%;
    min-width: 180px;
    border: 1px solid rgb(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 1rem;
    line-height: 1.5;

    h2 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
  }
}
</style>
