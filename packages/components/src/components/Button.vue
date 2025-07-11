<template>
  <button type="button" :class="classes" :disabled="currentlyDisabled" @click="onClick">
    <v-loader-icon v-if="isTimedOut" />
    <div class="btn__content">
      {{ label }}
      <!-- This can be used instead of label -->
      <slot />
    </div>
  </button>
</template>

<script>
import VLoaderIcon from '@/assets/eva_loader-outline.svg';

export default {
  name: 'v-button',
  components: { VLoaderIcon },
  props: {
    label: {
      type: String,
      required: false,
    },
    kind: {
      type: String,
      default: 'primary',
      validator(value) {
        return ['primary', 'secondary', 'ghost', 'native', 'native-ghost'].indexOf(value) !== -1;
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
    timeout: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      timeoutActive: false,
    };
  },

  computed: {
    currentlyDisabled() {
      return this.timeoutActive || this.disabled;
    },
    isTimedOut() {
      return this.timeout && this.timeoutActive;
    },
    classes() {
      return {
        btn: true,
        [`btn--${this.size}`]: true,
        [`btn--${this.kind}`]: true,
        'btn--timeout': this.isTimedOut,
      };
    },
  },

  methods: {
    onClick() {
      if (this.disabled) return;

      this.$emit('click');

      if (this.timeout <= 0) return;

      this.timeoutActive = true;
      setTimeout(() => {
        this.timeoutActive = false;
      }, this.timeout);
    },
  },
};
</script>

<style scoped lang="scss">
@keyframes spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.btn {
  border-radius: 8px;
  border-style: none;
  color: $vs-code-gray1;
  font-weight: bold;
  padding: 0.75em 1.5em;
  text-align: center;
  cursor: pointer;
  transition: $transition;
  user-select: none;

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:disabled {
    background-color: $gray2;
    border-color: $gray2;
    cursor: initial;

    &:hover {
      background-color: $gray2;
      border-color: $gray2;
    }
  }

  &--timeout {
    position: relative;

    svg {
      width: 2em;
      position: absolute;
      fill: $almost-black;
      top: 50%;
      transform: translate(-50%, -50%);
      animation: spin 2s linear infinite;
    }

    .btn__content {
      color: rgba(0, 0, 0, 0);
    }
  }

  &--native {
    background-color: $color-button-bg;
    color: $color-button-fg;
    &:hover {
      background-color: $color-button-bg-hover;
    }
    &:active {
      background-color: $color-highlight-dark;
    }
  }

  &--native-ghost {
    background-color: transparent;
    border: 1px solid $color-input-fg;
    color: $color-input-fg;

    &:hover {
      border-color: $color-highlight;
      color: $color-highlight;
    }

    &:active {
      border-color: $color-highlight-dark;
      color: $color-highlight-dark;
    }
  }

  &--primary {
    border: 2px solid $brightblue;
    color: white;
    background: none;
    background-color: $brightblue;

    &:hover {
      border-color: white;
    }

    &:active {
      background-color: rgba(255, 255, 255, 0.65);
    }
  }

  &--secondary {
    background-color: darken(desaturate($color: $brightblue, $amount: 75%), 25%);
    color: $white;

    &:hover {
      color: $gray1;
      background-color: $white;
    }

    &:active {
      background-color: rgba(255, 255, 255, 0.65);
    }
  }

  &--ghost {
    background-color: inherit;
    border: 1px solid $gray4;
    border-style: solid;
    color: $white;

    &:disabled {
      background-color: inherit;
      border-color: $gray6;
      color: $gray6;
    }

    &:hover {
      border-color: $white;
      background-color: $black;
    }

    &:active {
      color: $white;
      border-color: $white;
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
    padding: 0.5em 0.75rem;
  }
}
</style>
