<template>
  <div class="code-snippet" data-cy="code-snippet">
    <span
      type="text"
      class="input code-snippet__input"
      role="textbox"
      ref="input"
      @click="onInputFocus"
      @copy="onCopy"
    >
      <pre class="code-snippet__line" v-html="highlightedCode" v-if="highlightedCode" />
      <template v-else>
        <div v-for="(text, index) in textLines" :key="index" class="code-snippet__line">
          {{ text }}
        </div>
      </template>
    </span>
    <v-popper placement="top" ref="popper">
      <v-button
        class="code-snippet__btn"
        type="button"
        :kind="kind"
        data-cy="code-snippet-button"
        @click.native="copyToClipboard"
        :disabled="!hasClipboardAPI"
      >
        <ClipboardIcon class="code-snippet__btn-icon" />
      </v-button>
    </v-popper>
  </div>
</template>

<script>
import ClipboardIcon from '@/assets/copy-icon.svg';
import VPopper from './Popper.vue';
import VButton from '@/components/Button.vue';

import hljs from 'highlight.js';

export default {
  name: 'VCodeSnippet',
  components: {
    ClipboardIcon,
    VPopper,
    VButton,
  },
  props: {
    clipboardText: {
      type: String,
      required: false,
      default: '',
    },
    messageSuccess: {
      type: String,
      required: false,
      default: 'Copied to clipboard!',
    },
    kind: {
      type: String,
      required: false,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'ghost'].includes(value),
    },
    language: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      hasClipboardAPI:
        navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function',
    };
  },
  computed: {
    transformedText() {
      return this.clipboardText.replace(/\\n/g, '\n');
    },
    textLines() {
      return this.transformedText.split(/\n/g);
    },
    highlightedCode() {
      if (!this.language || !hljs.getLanguage(this.language)) return undefined;
      return hljs.highlight(this.language, this.transformedText).value;
    },
  },
  methods: {
    onInputFocus() {
      window.getSelection().selectAllChildren(this.$refs.input);
    },
    copyToClipboard() {
      const text = this.transformedText.trim();

      if (text && this.hasClipboardAPI) {
        navigator.clipboard.writeText(text.replace(/\n/g, '\n'));
        this.$refs.popper.flash(this.messageSuccess, 'success');
        this.onCopy();
      }
    },
    onCopy() {
      const text = this.transformedText.trim();
      this.$root.$emit('clipboard', text);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '~highlight.js/styles/base16/snazzy.css';
.code-snippet {
  margin: 1rem 0;
  border-radius: $border-radius;
  display: flex;
  align-items: stretch;
  color: white;
  background-color: $black;
  max-width: 100%;

  pre {
    margin: 0;
  }

  &__line {
    min-height: 1rem;
    line-height: 1.4;
    &:first-of-type {
      padding-top: 0.4rem;
    }
  }

  &__input {
    flex: 1;
    font-family: monospace;
    color: $base07;
    padding: 0.75rem 1.25rem;
    margin: 0;
    border: 1px solid rgba(white, 0.2);
    border-right: none;
    border-radius: $border-radius 0 0 $border-radius;
    background: transparent;
    outline: none;
    appearance: none;
    font-size: 0.9rem;
  }

  &__btn {
    height: 100%;
    padding: 0 1rem;
    margin: 0;
    border-radius: 0 6px 6px 0;
    opacity: 1;
    outline: none;
    appearance: none;
    cursor: pointer;
    transition: $transition;

    &[disabled] {
      opacity: 0.5;
      pointer-events: none;
    }

    &-icon {
      width: 1.1rem;
      fill: $white;
    }
  }
}
</style>
