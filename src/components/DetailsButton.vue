<template>
  <button type="button" :class="className">
    <slot />
  </button>
</template>

<script>
export default {
  name: 'v-details-button',
  props: {
    icon: {
      type: String,
      required: false,
    },
  },

  computed: {
    className() {
      const classNames = ['details-btn'];
      if (this.icon) {
        classNames.push(`details-btn--icon-${this.icon}`);
      }
      return classNames;
    },
  },
};
</script>

<style scoped lang="scss">
.details-btn {
  display: inline-block;
  border: 1px solid lighten($gray3, 05);
  border-radius: $border-radius;
  padding: 0.25rem 0.6rem 0.25rem 0.5rem;
  letter-spacing: 0.5px;
  color: $gray4;
  background-color: transparent;
  text-transform: uppercase;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;

  &:hover {
    background-color: darken($vs-code-gray1, 03);
    border-color: darken($vs-code-gray1, 03);
  }

  & + & {
    margin-top: 1rem;
  }

  &.details-btn--icon-clear:before {
    content: '✖ ';
  }

  &.details-btn--icon-back:before {
    content: '◄ ';
  }
}
</style>
