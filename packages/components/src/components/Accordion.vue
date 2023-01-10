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
    .accordion__header {
      border-bottom: 0;
    }
  }

  &--disabled {
    .accordion__header {
      cursor: default;
      color: $gray4;
    }
  }

  &__header {
    cursor: pointer;
    user-select: none;
    width: 100%;
    display: block;
    padding: 0.2rem 2rem;
    text-align: left;
  }

  &__body {
    padding: 0 2rem;
  }
}
</style>
