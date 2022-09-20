<template>
  <div :class="classes">
    <div class="accordion__header">
      <slot name="header" />
    </div>
    <div class="accordion__body" v-show="open">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Accordion',
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    open: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    classes() {
      return {
        accordion: true,
        'accordion--open': this.open,
        'accordion--disabled': this.disabled,
      };
    },
  },
};
</script>

<style lang="scss">
.accordion {
  &--open {
    border: 1px solid rgba(200, 200, 255, 0.1);

    .accordion__header {
      background-color: rgba(200, 200, 255, 0.1);
    }
  }

  &--disabled {
    .accordion__header {
      cursor: default;
      color: $gray4;

      &:hover {
        background-color: rgba(200, 200, 255, 0.05);
      }
    }
  }

  &__header {
    cursor: pointer;
    user-select: none;
    width: 100%;
    display: block;
    padding: 1em;
    text-align: left;

    &:hover {
      background-color: rgba(200, 200, 255, 0.1);
    }
  }

  &__body {
    margin-top: 1em;
  }
}
</style>
