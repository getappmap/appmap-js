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
  .tab-btn {
    appearance: none;
    border: 0;
    background-color: $gray2;
    cursor: pointer;
    color: $gray4;
    font-size: 1rem;
    padding: 0.5em 1em;
    margin: 0;
    transition: $transition;
    width: 50%;

    &:hover {
      color: lighten($blue, 10);
    }


    &:focus {
      outline: none;
    }

    &--active {
      background-color: $blue;
      cursor: default;
      color: $white;
      &:hover {
        color: $white;
      }
    }
  }
</style>
