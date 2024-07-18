<template>
  <v-context-container
    :title="title || language"
    :handle="handle"
    :location="location"
    :directory="directory"
    content-type="text"
    data-cy="code-snippet"
    class="code-snippet"
    @copy="copyToClipboard"
    @pin="onPin"
  >
    <pre><code v-html="highlightedCode" /><slot name="cursor" /></pre>
  </v-context-container>
</template>

<script lang="ts">
import Vue from 'vue';
import VContextContainer from '@/components/chat/ContextContainer.vue';
import ContextItemMixin from '@/components/mixins/contextItem';

import hljs from 'highlight.js';

hljs.registerAliases(['rake', 'Gemfile'], { languageName: 'ruby' });
hljs.registerAliases(['vue'], { languageName: 'xml' });

import type { PinEvent, PinCodeSnippet } from './PinEvent';

export default Vue.extend({
  props: {
    language: String,
    title: String,
    location: String,
    directory: String,
  },
  mixins: [ContextItemMixin],
  components: {
    VContextContainer,
  },
  data() {
    return {
      code: this.$slots.default?.[0].text ?? '',
    };
  },
  computed: {
    highlightedCode(): string {
      let language = hljs.getLanguage(this.language) ? this.language : 'plaintext';
      return hljs.highlight(language, this.code).value;
    },
  },
  methods: {
    copyToClipboard(): void {
      if (!this.code) return;

      navigator.clipboard.writeText(this.code);
    },
    onPin({ pinned, handle }: { pinned: boolean; handle: number }): void {
      const eventData: PinEvent & Partial<PinCodeSnippet> = { pinned, handle };
      if (pinned) {
        eventData.type = 'code-snippet';
        eventData.language = this.language;
        eventData.content = this.code;
      }
      this.$root.$emit('pin', eventData);
    },
  },
  updated() {
    // Slots are not reactive unless written directly to the DOM.
    // Luckily for us, this method is called when the content within the slot changes.
    this.code = this.$slots.default?.[0].text ?? '';
  },
});
</script>

<style lang="scss"></style>

<style lang="scss" scoped>
@import '~highlight.js/styles/base16/snazzy.css';
.code-snippet::v-deep {
  color: #e2e4e5;

  pre {
    margin: 0;
    border: 0;
    border-radius: 0;
    padding: 0.5rem 1rem 0.25rem 1rem;
    overflow: auto;
  }

  code {
    line-height: 1.6;
    color: inherit;
    background-color: inherit;
  }
}
</style>
