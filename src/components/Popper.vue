<template>
  <div class="popper" @mouseover="hover = true" @mouseleave="hover = false">
    <span :class="`popper__text popper__text--${placement}`" v-if="hover">
      {{ text }}
    </span>

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
      validator: (value) => ['left', 'right'].indexOf(value) !== -1,
    },
    text: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      hover: false,
    };
  },
};
</script>

<style scoped lang="scss">
.popper {
  position: relative;

  &__text {
    position: absolute;
    display: block;
    background: $black;
    color: $white;
    padding: 4px 8px;
    border-radius: 4px;
    max-width: 24em;
    transition: opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border: 1px solid $white;
    pointer-events: none;
    top: 0;
    z-index: 2147483647;
    transform: translateY(-20%);
    word-wrap: break-word;
    word-break: normal;
    text-align: initial;

    &--left {
      right: 100%;
      margin-right: 1em;
    }

    &--right {
      left: 100%;
      margin-left: 1em;
    }
  }
}
</style>
