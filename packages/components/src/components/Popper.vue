<template>
  <div class="popper" @mouseover="hover = true" @mouseleave="hover = false">
    <transition name="fade">
      <span
        :class="`popper__text popper__text--${placement} popper__text--${flashStyle} popper__text--align-${textAlign}`"
        v-if="isVisible"
        v-html="textValue"
      ></span>
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
      validator: (value) => ['left', 'right', 'top', 'bottom'].indexOf(value) !== -1,
    },
    text: {
      type: String,
    },
    flashTime: {
      type: Number,
      default: 1500,
    },
    textAlign: {
      type: String,
      default: 'center',
      validator: (value) => ['left', 'right', 'center'].indexOf(value) !== -1,
    },
  },

  data() {
    return {
      displayFlash: false,
      hover: false,
      flashText: '',
      flashTimer: null,
      flashStyle: 'default',
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
      return (this.displayFlash && this.flashText) || (this.hover && this.textValue);
    },
    textValue() {
      return this.flashText || this.text;
    },
  },

  methods: {
    flash(text, style = 'default') {
      this.displayFlash = true;
      this.flashText = text;
      this.flashStyle = style;

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
$bg: $almost-black;
$border-color: $gray1;

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
    font-size: 0.75rem;
    word-wrap: break-word;
    word-break: normal;
    width: max-content;

    &--align-left {
      text-align: left;
    }

    &--align-right {
      text-align: right;
    }

    &--align-center {
      text-align: center;
    }

    &--left {
      right: 100%;
      margin-right: 1em;
      top: 50%;
      transform: translateY(-50%);

      &::before {
        content: '';
        position: absolute;
        bottom: -1px;
        right: -1px;
        top: 50%;
        width: 1em;
        height: 1em;
        transform: translate(50%, -50%) rotateZ(45deg);
        background: $bg;
        z-index: -1;
        border: 1px solid $border-color;
        border-left: none;
        border-bottom: none;
      }
    }

    &--right {
      left: 100%;
      margin-left: 1em;
      top: 50%;
      transform: translateY(-50%);

      &::before {
        content: '';
        position: absolute;
        bottom: -1px;
        left: -1px;
        top: 50%;
        width: 1em;
        height: 1em;
        transform: translate(-50%, -50%) rotateZ(45deg);
        background: $bg;
        z-index: -1;
        border: 1px solid $border-color;
        border-right: none;
        border-top: none;
      }
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

    &--success {
      border-color: $brightblue;

      &::before {
        border-color: inherit;
      }
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
  pointer-events: none;
}
</style>
