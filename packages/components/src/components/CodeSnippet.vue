<template>
  <div class="code-snippet">
    <span
      type="text"
      class="input code-snippet__input"
      role="textbox"
      ref="input"
      @click="onInputFocus"
      @copy="onCopy"
    >
      {{ clipboardText }}
    </span>
    <v-popper placement="top" ref="popper">
      <button
        class="code-snippet__btn"
        type="button"
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
        navigator &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function',
    };
  },
  methods: {
    onInputFocus() {
      window.getSelection().selectAllChildren(this.$refs.input);
    },
    copyToClipboard() {
      const text = this.clipboardText.trim();

      if (text && this.hasClipboardAPI) {
        navigator.clipboard.writeText(text);
        this.$refs.popper.flash(this.messageSuccess, 'success');
        this.onCopy();
      }
    },
    onCopy() {
      const text = this.clipboardText.trim();
      this.$root.$emit('clipboard', text);
    },
  },
};
</script>

<style lang="scss" scoped>
.code-snippet {
  margin: 1rem 0;
  border-radius: $border-radius;
  border: 1px solid $color-highlight;
  display: flex;
  align-items: stretch;
  color: white;
  background-color: rgba(0, 0, 0, 0.25);
  max-width: 100%;

  &__input {
    flex: 1;
    font-family: monospace;
    color: $color-foreground;
    padding: 0.75rem 1.25rem;
    margin: 0;
    border: none;
    border-right: 1px solid $color-highlight;
    border-radius: 0;
    background: transparent;
    outline: none;
    appearance: none;
    font-size: 1rem;
  }

  &__btn {
    height: 100%;
    padding: 0 1rem;
    margin: 0;
    border: none;
    border-radius: 0 6px 6px 0;
    color: $color-foreground-light;
    background-color: $color-highlight;
    opacity: 0.85;
    outline: none;
    appearance: none;
    cursor: pointer;
    transition: 0.25s ease opacity;

    &[disabled] {
      opacity: 0.5;
      pointer-events: none;
    }

    &:hover {
      color: rgba(255, 255, 255, 0.9);
      opacity: 1;
    }

    &:active {
      color: rgba(255, 255, 255, 0.65);
    }

    &-icon {
      width: 1rem;
      fill: currentColor;
    }
  }
}
</style>
