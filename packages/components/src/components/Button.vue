<template>
  <button type="button" :class="classes" :disabled="disabled">
    {{ label }}
  </button>
</template>

<script>
export default {
  name: 'v-button',
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
};
</script>

<style scoped lang="scss">
.btn {
  border-radius: 8px;
  border-style: none;
  color: $color-background;
  font-weight: bold;
  padding: 0.75em 1.5em;
  text-align: center;
  cursor: pointer;
  transition: 0.25s ease background-color;
  user-select: none;

  &:disabled {
    background-color: $gray6;
    color: $gray4;
  }

  &--primary {
    border: 1px solid $color-highlight;
    color: $white;
    background: none;

    &:hover {
      background-color: $color-highlight;
    }

    &:active {
      background-color: rgba(255, 255, 255, 0.65);
    }
  }
  &--secondary {
    background-color: $blue;
  }
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

    &:hover {
      color: rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.9);
    }

    &:active {
      color: rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.65);
    }
  }

  &--large {
    font-size: 18px;
  }
  &--medium {
    font-size: 14px;
  }
  &--small {
    font-size: 12px;
  }
}
</style>
