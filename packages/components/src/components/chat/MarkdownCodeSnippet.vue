<template>
  <v-context-container
    :title="language"
    :handle="handle"
    content-type="text"
    class="code-snippet"
    @copy="copyToClipboard"
    @pin="onPin"
  >
    <pre><code v-html="highlightedCode" /></pre>
  </v-context-container>
</template>

<script lang="ts">
import Vue from 'vue';
import VContextContainer from '@/components/chat/ContextContainer.vue';
import ContextItemMixin from '@/components/mixins/contextItem';

import hljs from 'highlight.js';

import type { PinEvent, PinCodeSnippet } from './PinEvent';

export default Vue.extend({
  props: {
    language: String,
  },
  mixins: [ContextItemMixin],
  components: {
    VContextContainer,
  },
  computed: {
    code(): string {
      return this.$slots.default?.[0].text ?? '';
    },
    highlightedCode(): string {
      return hljs.highlight(this.language ?? 'plaintext', this.code).value;
    },
  },
  methods: {
    copyToClipboard() {
      if (!this.code) return;

      navigator.clipboard.writeText(this.code);
    },
    onPin({ pinned, handle }: { pinned: boolean; handle: number }) {
      const eventData: PinEvent & Partial<PinCodeSnippet> = { pinned, handle };
      if (pinned) {
        eventData.type = 'code-snippet';
        eventData.language = this.language;
        eventData.content = this.code;
      }
      this.$root.$emit('pin', eventData);
    },
  },
});
</script>

<style lang="scss" scoped>
.code-snippet::v-deep {
  pre {
    margin: 0;
    border: 0;
    border-radius: 0;
    padding: 0.5rem 1rem 0.25rem 1rem;
    overflow: auto;
  }

  code {
    line-height: 1.6;
  }
}
</style>
