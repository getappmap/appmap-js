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
    timeout: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      currentlyDisabled: this.disabled,
    };
  },

  computed: {
    isTimedOut() {
      return !this.disabled && this.currentlyDisabled;
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
      if (!this.timeout) return;

      this.currentlyDisabled = true;
      setTimeout(() => {
        this.currentlyDisabled = false;
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

  &:disabled {
    background-color: $gray2;
    border-color: $gray2;

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

  &--primary {
    border: 1px solid $brightblue;
    color: $white;
    background: none;

    &:hover {
      background-color: $brightblue;
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
  }
}
</style>
