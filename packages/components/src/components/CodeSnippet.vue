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
      <div v-for="(text, index) in textLines" :key="index" class="code-snippet__line">
        {{ text }}
      </div>
    </span>
    <v-popper placement="top" ref="popper">
      <button
        class="code-snippet__btn"
        type="button"
        data-cy="code-snippet-button"
        @click="copyToClipboard"
        :disabled="!hasClipboardAPI"
      >
        <ClipboardIcon class="code-snippet__btn-icon" />
      </button>
    </v-popper>
  </div>
</template>

<script>
import ClipboardIcon from '@/assets/clipboard.svg';
import VPopper from './Popper.vue';

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
.code-snippet {
  margin: 1rem 0;
  border-radius: $border-radius;
  display: flex;
  align-items: stretch;
  color: white;
  background-color: $black;
  max-width: 100%;

  &__line {
    min-height: 1rem;
  }

  &__input {
    flex: 1;
    font-family: monospace;
    color: $base07;
    padding: 0.75rem 1.25rem;
    margin: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    outline: none;
    appearance: none;
    font-size: 0.9rem;
  }

  &__btn {
    height: 100%;
    padding: 0 1rem;
    margin: 0;
    border: none;
    border-radius: 0 6px 6px 0;
    color: #fff;
    background-color: $white;
    opacity: 1;
    outline: none;
    appearance: none;
    cursor: pointer;
    transition: $transition;

    &[disabled] {
      opacity: 0.5;
      pointer-events: none;
    }

    &:hover {
      opacity: 0.5;
    }

    &:active {
      color: rgba(255, 255, 255, 0.65);
    }

    &-icon {
      width: 1.2rem;
      fill: $black;
    }
  }
}
</style>
