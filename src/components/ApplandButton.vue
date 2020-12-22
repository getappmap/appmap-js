<template>
  <button type="button" :class="classes" @click="onClick" :disabled="disabled">
    {{ label }}
  </button>
</template>

<script>
export default {
  name: 'appland-button',
  props: {
    label: {
      type: String,
      required: true,
    },
    kind: {
      type: String,
      default: 'primary',
      validator(value) {
        return ['primary', 'secondary', 'ghost'].indexOf(value) !== 1;
      },
    },
    size: {
      type: String,
      default: 'medium',
      validator(value) {
        return ['small', 'medium', 'large'].indexOf(value) !== -1;
      },
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    classes() {
      return [`--${this.size}`, `--${this.kind}`];
    },
  },

  methods: {
    onClick() {
      this.$emit('onClick');
    },
  },
};
</script>

<style scoped lang="scss">
  button {
    border-radius: 8px;
    border-style: none;
    color: #EAEAEA;
    padding: 0.5em 1em;
    text-align: center;

    &:disabled {
      background-color: #EAEAEA;
      color: #808B98;
    }

    &.--primary { background-color: #FF07AA; }
    &.--secondary { background-color: #4362B1; }
    &.--ghost {
      background-color: inherit;
      border: 1px solid #808B98;
      border-style: solid;
      color: #808B98;
      &:disabled { border-color: #EAEAEA; }
    }

    &.--large { font-size: 18px; }
    &.--medium { font-size: 14px; }
    &.--small { font-size: 12px; }
  }
</style>
