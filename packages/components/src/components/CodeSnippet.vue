<template>
  <div class="code-snippet">
    <input
      type="text"
      class="code-snippet__input"
      ref="input"
      v-model="clipboardText"
      @focus="onInputFocus"
      @copy="onCopy"
    />
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
  name: 'CodeSnippet',
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
      hasClipboardAPI: false,
    };
  },
  methods: {
    onInputFocus() {
      this.$refs.input.select();
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

  mounted() {
    if (
      navigator &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      this.hasClipboardAPI = true;
    }
  },
};
</script>

<style lang="scss" scoped>
.code-snippet {
  margin: 1rem 0;
  border-radius: $border-radius;
  border: 2px solid #3794ff;
  display: flex;
  align-items: stretch;
  color: white;

  &__input {
    flex: 1;
    font-family: monospace;
    color: white;
    padding: 0.75rem 1.25rem;
    margin: 0;
    border: none;
    border-right: 1px solid #3794ff;
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
    border-radius: 0;
    color: #3794ff;
    background: transparent;
    outline: none;
    appearance: none;
    cursor: pointer;

    &[disabled] {
      opacity: 0.5;
      pointer-events: none;
    }

    &-icon {
      width: 1rem;
      fill: currentColor;
    }
  }
}
</style>
