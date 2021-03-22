<template>
  <div class="popper" :style="styles">
    <div class="popper__button" v-if="!open" @mousedown="open = true">
      <slot name="icon" />
    </div>
    <div class="popper__body" v-if="open" @mouseleave="open = false">
      <div class="popper__content">
        <slot name="body" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'v-popper-menu',
  props: {
    position: {
      type: String,
      default: 'top left',
      validator: (value) => {
        const [v, h] = value.split(/\s+?/);
        return (
          ['top', 'center', 'bottom'].indexOf(v) !== -1 &&
          ['left', 'center', 'right'].indexOf(h) !== -1
        );
      },
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
    styles() {
      const result = {};
      const transform = { x: 0, y: 0 };

      if (this.vAlign === 'top') {
        result.top = 0;
      } else if (this.vAlign === 'center') {
        result.top = '50%';
        transform.y = '-50%';
      } else if (this.vAlign === 'bottom') {
        result.bottom = 0;
      }

      if (this.hAlign === 'left') {
        result.left = 0;
      } else if (this.hAlign === 'center') {
        result.left = '50%';
        transform.x = '-50%';
      } else if (this.hAlign === 'right') {
        result.right = 0;
      }

      if (transform.x || transform.y) {
        result.transform = `translate(${transform.x}, ${transform.y})`;
      }

      return result;
    },
  },
};
</script>

<style lang="scss" scoped>
.popper {
  position: absolute;
  padding: 0.25rem;

  &__button {
    background: $general;
    padding: 0.5rem;
    border-radius: 1rem;
    color: $white;
    cursor: pointer;
    opacity: 0.8;
    line-height: 0;
    transition: $transition;

    &:hover {
      opacity: 1;
    }

    svg {
      width: 1rem;
      height: 1rem;
    }
  }

  $border-radius: 1rem;

  &__body {
    background: $general;
    padding: 0.2rem;
    border-radius: $border-radius;
  }

  &__content {
    border-radius: $border-radius;
    background-color: $black;
    opacity: 0.8;
    padding: 1rem;
    color: $white;
    font-family: $appland-text-font-family;

    h2 {
      font-size: 1.2rem;
      margin: 0 0 0.5rem 0;
    }
  }
}
</style>
