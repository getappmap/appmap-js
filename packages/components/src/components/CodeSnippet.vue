<template>
  <v-popper placement="top" text="Click to copy" ref="popper">
    <pre class="code-snippet" @click="copyToClipboard" ref="code"><slot /></pre>
  </v-popper>
</template>

<script>
import VPopper from './Popper.vue';

export default {
  name: 'CodeSnippet',
  components: {
    VPopper,
  },
  props: {
    clipboardText: {
      type: String,
      required: false,
      default: null,
    },
  },
  methods: {
    copyToClipboard() {
      const text = this.clipboardText || this.$refs.code.innerText;
      if (
        text === '' ||
        !navigator ||
        !navigator.clipboard ||
        typeof navigator.clipboard.writeText !== 'function'
      ) {
        return;
      }

      navigator.clipboard.writeText(text);
      this.$refs.popper.flash('Copied to clipboard!');
    },
  },
};
</script>

<style lang="scss" scoped>
.code-snippet {
  font-family: monospace;
  color: #d7ba7d;
  cursor: pointer;
  border-radius: $border-radius;
  border: 1px solid $base13;
  padding: 1em;
}
</style>
