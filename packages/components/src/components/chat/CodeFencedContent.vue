<template>
  <component :is="component" :uri="uri" v-bind="metadata">{{ content }}</component>
</template>

<script lang="ts">
import Vue from 'vue';
import MarkdownCodeSnippet from './MarkdownCodeSnippet.vue';
import MermaidDiagram from './MermaidDiagram.vue';
import { pinnedItemRegistry } from '@/lib/pinnedItems';
import stripCodeFences from '@/lib/stripCodeFences';

export default Vue.extend({
  components: {
    MarkdownCodeSnippet,
    MermaidDiagram,
  },
  props: {
    uri: String,
  },
  computed: {
    generatedContent(): { content: string; metadata: Record<string, string> } | undefined {
      return pinnedItemRegistry.get(this.uri);
    },
    component(): Vue.Component {
      return this.generatedContent?.metadata?.language === 'mermaid'
        ? MermaidDiagram
        : MarkdownCodeSnippet;
    },
    metadata(): Record<string, string> {
      return this.generatedContent?.metadata ?? {};
    },
    content(): string {
      return stripCodeFences(this.generatedContent?.content ?? '');
    },
  },
});
</script>
