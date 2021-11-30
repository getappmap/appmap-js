<template>
  <div :class="classes">
    <div class="popper__button" @click="open = !open">
      <slot name="icon" />
    </div>
    <div class="popper__body" v-if="open">
      <div class="popper__content">
        <slot name="body" />
      </div>
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
        return (
          ['top', 'bottom'].indexOf(v) !== -1 &&
          ['left', 'right'].indexOf(h) !== -1
        );
      },
    },
    isHighlight: {
      type: Boolean,
      default: false,
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
  computed: {
    classes() {
      const classNames = [
        'popper',
        `popper--v-${this.vAlign}`,
        `popper--h-${this.hAlign}`,
      ];

      if (this.isHighlight) {
        classNames.push('popper--highlight');
      }

      if (this.open) {
        classNames.push('popper--opened');
      }

      return classNames;
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

  &__button {
    position: relative;
    padding: 0.2rem;
    color: inherit;
    cursor: pointer;
    line-height: 0;
    transition: $transition;

    .popper--highlight & {
      color: $light-purple;
    }

    svg {
      width: 1rem;
      height: 1rem;
    }
  }

  &.popper--opened,
  &:hover {
    color: $gray5;
  }

  $border-radius: 1rem;

  &__body {
    border-radius: 0.5rem;
    border: 1px solid $light-purple;
    position: absolute;
    width: max-content;
    height: max-content;
    max-width: 70vw;
    max-height: 70vh;
    padding: 1rem;
    font-family: $appland-text-font-family;
    color: $gray6;
    background: #191919;
    overflow: auto;

    .popper--v-top & {
      bottom: 100%;
      margin-bottom: 0.8rem;
    }

    .popper--v-bottom & {
      top: 100%;
      margin-top: 0.8rem;
    }

    .popper--h-left & {
      right: 0;
    }

    .popper--h-right & {
      left: 0;
    }

    h2 {
      font-size: 1.1rem;
      margin: 0 0 0.25rem 0;
    }
  }
}
</style>
