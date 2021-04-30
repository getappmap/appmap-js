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
  border: 1px solid $base13;
  border-radius: $border-radius;
  background-color: transparent;
  background-origin: border-box;
  background-clip: border-box;
  background-position: -1px 0;
  background-size: calc(100% + 2px);
  cursor: pointer;
  color: $base11;
  font-size: 0.75rem;
  padding: 0.5rem 1.5rem;
  margin: 0;
  transition: $transition;
  letter-spacing: 0.5px;
  white-space: nowrap;

  &:hover,
  &:active {
    color: $white;
  }

  &:focus {
    outline: none;
  }

  & + & {
    margin-left: 0.75rem;
  }

  &--active {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    border-color: transparent;
    background-image: $general;
    cursor: default;
    color: $white;
    &:hover {
      color: $white;
    }
  }
}
</style>
