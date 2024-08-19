<template>
  <div
    class="popper"
    @mouseover="onHover"
    @mouseleave="onLeave"
    @mousemove="onHover"
    @click="onClick"
  >
    <transition name="fade">
      <span :class="classes" v-if="isVisible">
        <div v-if="textValue" v-html="textValue" />
        <slot else name="content" />
      </span>
    </transition>

    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'v-popper',

  props: {
    placement: {
      type: String,
      required: true,
      validator: (value: string) =>
        ['left', 'right', 'top', 'bottom', 'none'].indexOf(value) !== -1,
    },
    align: {
      type: String,
      default: 'center',
      validator: (value: string) => ['left', 'right', 'center'].indexOf(value) !== -1,
    },
    text: {
      type: String,
    },
    flashTime: {
      type: Number,
      default: 1500,
    },
    disabled: {
      default: false,
    },
    arrow: {
      default: true,
    },
    timeToDisplay: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      displayFlash: false,
      hover: false,
      flashText: '',
      flashTimer: undefined as number | undefined,
      flashStyle: 'default',
      visibleOverride: false,
      hoverTimer: undefined as number | undefined,
      ignoreHover: false,
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
    isVisible(): boolean {
      const explicitlyVisible = this.visibleOverride;
      const isHovered =
        !this.disabled && this.hover && (!!this.textValue || !!this.$slots.content?.length);
      const isFlashed = !this.disabled && this.displayFlash && Boolean(this.flashText);
      return explicitlyVisible || isHovered || isFlashed;
    },
    textValue(): string {
      return this.flashText || this.text;
    },
    classes(): Record<string, boolean> {
      return {
        popper__text: true,
        'popper__text--no-arrow': !this.arrow,
        [`popper__text--align-${this.align}`]: true,
        [`popper__text--${this.placement}`]: true,
        [`popper__text--${this.flashStyle}`]: true,
      };
    },
  },

  methods: {
    flash(text: string, style = 'default') {
      this.displayFlash = true;
      this.flashText = text;
      this.flashStyle = style;

      if (this.flashTimer) {
        clearTimeout(this.flashTimer);
        this.flashTimer = undefined;
      }

      this.flashTimer = setTimeout(() => {
        this.displayFlash = false;
        this.flashTimer = undefined;
      }, this.flashTime) as unknown as number;
    },
    show() {
      this.visibleOverride = true;
    },
    hide() {
      this.visibleOverride = false;
    },
    onHover() {
      if (this.ignoreHover) return;

      if (this.timeToDisplay > 0) {
        if (this.hoverTimer) {
          window.clearTimeout(this.hoverTimer);
        }

        this.hoverTimer = window.setTimeout(() => {
          this.hover = true;
          this.hoverTimer = undefined;
        }, this.timeToDisplay);
      } else {
        this.hover = true;
      }
    },
    onLeave() {
      if (this.hoverTimer) {
        window.clearTimeout(this.hoverTimer);
        this.hoverTimer = undefined;
      }
      this.hover = false;
      this.ignoreHover = false;
    },
    onClick() {
      if (this.hoverTimer) {
        window.clearTimeout(this.hoverTimer);
        this.hoverTimer = undefined;
      }
      this.hover = false;
      this.ignoreHover = true;
    },
  },
});
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

    &--none {
      &::before {
        display: none;
      }
    }

    &--success {
      border-color: $brightblue;

      &::before {
        border-color: inherit;
      }
    }

    &--no-arrow {
      margin-top: 0;
      &::before {
        display: none;
      }
    }

    &--align-left {
      left: 0;
      transform: translateY(-100%);
    }

    &--align-right {
      right: 0;
    }

    &--align-center {
      left: 50%;
      transform: translateX(-50%);
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
