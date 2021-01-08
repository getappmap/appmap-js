<template>
  <button :class="classes">
    {{ label }}
  </button>
</template>

<script>
export default {
  name: 'v-tab-button',

  computed: {
    classes() {
      return {
        'tab-btn': true,
        'tab-btn--active': this.isActive,
      };
    },
  },

  props: {
    label: {
      type: String,
      required: true,
    },
    isActive: Boolean,
  },
};
</script>

<style scoped lang="scss">
  $bg-color: $gray4;

  .tab-btn {
    appearance: none;
    border: 2px solid $gray3;
    background-color: $bg-color;
    padding: 0.5em 1em;
    margin-left: 2px;
    cursor: pointer;

    &:focus {
      outline-style: solid;
      outline-color: transparent;
    }

    &--active {
      cursor: default;

      border-bottom: 2px solid lighten($bg-color, 20%);
      background-color: lighten($bg-color, 20%);
    }
  }
</style>
