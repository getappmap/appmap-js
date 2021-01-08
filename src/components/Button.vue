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
        return ['primary', 'secondary', 'ghost'].indexOf(value) !== -1;
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
      return ['btn', `btn--${this.size}`, `btn--${this.kind}`];
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
  .btn {
    border-radius: 8px;
    border-style: none;
    color: $gray6;
    padding: 0.5em 1em;
    text-align: center;

    &:disabled {
      background-color: $gray6;
      color: $gray4;
    }

    &--primary { background-color: $hotpink; }
    &--secondary { background-color: $blue; }
    &--ghost {
      background-color: inherit;
      border: 1px solid $gray4;
      border-style: solid;
      color: $gray4;

      &:disabled {
        background-color: inherit;
        border-color: $gray6;
        color: $gray6;
      }
    }

    &--large { font-size: 18px; }
    &--medium { font-size: 14px; }
    &--small { font-size: 12px; }
  }
</style>
