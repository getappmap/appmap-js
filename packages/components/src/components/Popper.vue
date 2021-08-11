<template>
  <div class="popper" @mouseover="hover = true" @mouseleave="hover = false">
    <transition name="fade">
      <span :class="`popper__text popper__text--${placement}`" v-if="isVisible">
        {{ textValue }}
      </span>
    </transition>

    <slot />
  </div>
</template>

<script>
export default {
  name: 'v-popper',

  props: {
    placement: {
      type: String,
      required: true,
      validator: (value) =>
        ['left', 'right', 'top', 'bottom'].indexOf(value) !== -1,
    },
    text: {
      type: String,
      required: true,
    },
    flashTime: {
      type: Number,
      default: 1500,
    },
  },

  data() {
    return {
      hover: false,
      displayFlash: false,
      flashText: '',
      flashTimer: null,
    };
  },

  watch: {
    isVisible(visible) {
      if (!visible) {
        this.flashText = '';
      }
    },
  },

  computed: {
    isVisible() {
      return this.displayFlash || this.hover;
    },

    textValue() {
      return this.flashText || this.text;
    },
  },

  methods: {
    flash(text) {
      this.flashText = text;
      this.displayFlash = true;

      if (this.flashTimer) {
        clearTimeout(this.flashTimer);
      }

      this.flashTimer = setTimeout(() => {
        this.displayFlash = false;
        this.flashTimer = null;
      }, this.flashTime);
    },
  },
};
</script>

<style scoped lang="scss">
$margin: 1em;
$bg: $black;
$border-color: $gray4;

.popper {
  position: relative;

  &__text {
    position: absolute;
    display: block;
    background: $bg;
    color: $white;
    padding: 1em;
    border-radius: 4px;
    max-width: 24em;
    transition: opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border: 1px solid $border-color;
    pointer-events: none;
    top: 0;
    z-index: 2147483647;
    transform: translateY(-20%);
    word-wrap: break-word;
    word-break: normal;
    text-align: initial;
    width: max-content;

    &--left {
      right: 100%;
      margin-right: 1em;
    }

    &--right {
      left: 100%;
      margin-left: 1em;
    }

    &--top {
      transform: translate(-50%, -100%);
      left: 50%;
      margin-top: -$margin;

      &::before {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 50%;
        width: 1em;
        height: 1em;
        transform: translate(-50%, 0.5em) rotateZ(45deg);
        background: $bg;
        z-index: -1;
        border: 1px solid $border-color;
        border-left: none;
        border-top: none;
      }
    }

    &--bottom {
      top: 100%;
      transform: translateY(0);
    }
  }
}

.fade-enter {
  opacity: 0;
  pointer-events: none;
}

.fade-enter-active {
  transition: opacity 1 ease;
  transition-delay: 0.1s;
  pointer-events: auto;
}

.fade-leave-to {
  opacity: 0;
  pointer-events: none;
}

.fade-leave-active {
  transition: opacity 0 ease;
  transition-delay: 0.25s;
  pointer-events: auto;
}
</style>
