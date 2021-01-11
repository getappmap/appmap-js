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
    flex: 1;
    appearance: none;
    border: none;
    background-color: $black;
    padding: 0.4rem 1rem;
    text-align: center;
    font: inherit;
    font-size: 0.8rem;
    font-weight: bold;
    color: $gray4;
    cursor: pointer;

    &:focus {
      outline-style: solid;
      outline-color: transparent;
    }

    &--active {
      color: white;
      background-color: $blue;
      cursor: default;
      pointer-events: none;
    }
  }
</style>
