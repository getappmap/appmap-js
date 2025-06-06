<template>
  <div class="code-snippet" data-cy="code-snippet">
    <div
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
    </div>
    <div class="code-snippet__copy-gutter" v-if="showCopy">
      <v-popper class="code-snippet__popper" placement="left" ref="popper" text="Copy to clipboard">
        <div
          class="code-snippet__button"
          data-cy="code-snippet-button"
          @click="copyToClipboard"
          :disabled="!hasClipboardAPI"
        >
          <ClipboardIcon class="code-snippet__btn-icon" />
        </div>
      </v-popper>
    </div>
  </div>
</template>

<script>
import ClipboardIcon from '@/assets/copy-icon.svg';
import VPopper from './Popper.vue';
import emitter from '@/lib/eventBus';

import hljs from 'highlight.js';

export default {
  name: 'VCodeSnippet',
  components: {
    ClipboardIcon,
    VPopper,
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
    language: {
      type: String,
      required: false,
    },
    showCopy: {
      type: Boolean,
      default: true,
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
      emitter.emit('clipboard', text);
    },
  },
};
</script>

<style lang="scss" scoped>
.code-snippet {
  margin: 1rem 0;
  border-radius: $border-radius;
  position: relative;
  align-items: stretch;
  color: white;
  background-color: rgba(black, 0.75);
  max-width: 100%;
  border: 1px solid rgba(white, 0.2);
  display: flex;

  pre {
    margin: 0;
    margin-right: 1rem;
    width: fit-content;
  }

  &__line {
    min-height: 1rem;
    line-height: 1.4;
  }

  &__copy-gutter {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    padding: 0.5rem 1rem;
  }

  &__popper {
    height: fit-content;
    position: sticky !important;
    top: 0.5rem;

    &::v-deep {
      .popper__text {
        background-color: #040404;
        border-color: rgba(white, 0.2);
        margin-right: 0;
        padding: 0.25rem 0.5rem;

        &:before {
          display: none;
        }
      }
    }
  }

  &__input {
    flex: 1;
    font-family: monospace;
    color: $base07;
    margin: 0;
    margin-right: 2.5rem;
    border-right: none;
    border-radius: $border-radius 0 0 $border-radius;
    background: transparent;
    outline: none;
    appearance: none;
    font-size: 0.9rem;
    overflow-x: auto;
    scrollbar-color: rgba(white, 0.2) transparent;
    scrollbar-width: thin;
    padding: 0.5rem 1rem;
    padding-top: 1rem;
  }

  &__button {
    cursor: pointer;
    transition: $transition;
    overflow: visible;
    background-color: rgba(black, 0.8);
    padding: 0.33rem;
    height: fit-content;
    border-radius: $border-radius;
    display: flex;

    &:hover {
      svg {
        fill: white;
        transform: scale(1.1);
        transform-origin: center;
      }
    }

    svg {
      width: 18px;
      fill: rgba(white, 0.5);
    }

    &[disabled] {
      opacity: 0.5;
      pointer-events: none;
    }
  }
}
</style>
