<template>
  <div :class="classes" :data-full-screen-allowed="allowFullscreen">
    <div @click="open = !open" data-cy="popper-button">
      <slot name="icon" />
    </div>
    <div class="popper__body" v-if="open" ref="popperBody">
      <slot name="body" />
    </div>
  </div>
</template>

<script>
import { getEventTarget } from '@appland/diagrams';

export default {
  name: 'v-popper-menu',
  props: {
    position: {
      type: String,
      default: 'bottom left',
      validator: (value) => {
        const [v, h] = value.split(/\s+?/);
        return ['top', 'bottom'].indexOf(v) !== -1 && ['left', 'right'].indexOf(h) !== -1;
      },
    },
    isHighlight: {
      type: Boolean,
      default: false,
      required: false,
    },
    allowFullscreen: {
      type: Boolean,
      default: true,
      required: false,
    },
  },
  data() {
    return {
      vAlign: this.position.split(/\s+?/)[0],
      hAlign: this.position.split(/\s+?/)[1],
      open: false,
    };
  },
  watch: {
    async open(isOpen) {
      if (!isOpen) {
        return;
      }

      // Let the DOM update before referencing the popper body.
      // It won't exist until the next tick.
      await this.$nextTick();

      const { top } = this.$refs.popperBody.getBoundingClientRect();
      if (top < 0) {
        const padding = 16;
        window.scrollBy({ top: top - padding, behavior: 'smooth' });
      }
    },
  },
  computed: {
    classes() {
      const classNames = ['popper', `popper--v-${this.vAlign}`, `popper--h-${this.hAlign}`];

      if (this.isHighlight) {
        classNames.push('popper--highlight');
      }

      if (this.open) {
        classNames.push('popper--opened');
      }

      return classNames;
    },
  },
  methods: {
    close() {
      this.open = false;
    },
  },
  mounted() {
    window.addEventListener('click', (event) => {
      if (!getEventTarget(event.target, this.$el)) {
        this.open = false;
      }
    });
  },
};
</script>

<style lang="scss" scoped>
.popper {
  display: inline-block;
  position: relative;
  color: $gray4;

  &.popper--opened,
  &:hover {
    color: $gray5;
  }

  &[data-full-screen-allowed='true'] &__body {
    @media (max-width: 900px) {
      position: fixed;
      left: 0 !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      max-width: inherit !important;
      max-height: inherit !important;
      width: inherit !important;
      height: inherit !important;
      margin: 0 !important;
      border-radius: 0 !important;
      z-index: 1000;
      transform: none !important;
    }
  }

  &__body {
    position: absolute;
    width: max-content;
    height: max-content;
    max-width: 70vw;
    max-height: 85vh;
    font-family: $appland-text-font-family;
    overflow: auto;

    .popper--v-top & {
      bottom: 100%;
      margin-bottom: 0.8rem;
    }

    .popper--v-bottom & {
      top: 100%;
    }

    .popper--h-left & {
      right: 0;
    }

    .popper--h-right & {
      left: 0;
    }
    .narrow & {
      transform: translateX(50%);
    }

    h2 {
      font-size: 1.1rem;
      margin: 0 0 0.25rem 0;
    }
  }
}
</style>
