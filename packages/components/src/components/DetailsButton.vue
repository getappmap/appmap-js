<template>
  <button type="button" class="details-btn">
    <i :class="iconClass" v-if="icon" />

    <!-- Wrap the slot in a single object for better alignment -->
    <span>
      <slot />
    </span>
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
    iconClass() {
      return `icon icon--${this.icon}`;
    },
  },
};
</script>

<style scoped lang="scss">
.details-btn {
  display: flex;
  border: 1px solid $gray4;
  border-radius: $border-radius;
  padding: 0.25rem 0.6rem 0.25rem 0.5rem;
  letter-spacing: 0.5px;
  color: $gray4;
  background-color: transparent;
  font-size: 0.85rem;
  cursor: pointer;
  outline: none;
  text-align: left;
  align-items: center;
  transition: $transition;

  &:hover:not(&--disabled) {
    background-color: $gray4;
    border-color: $gray4;
    color: $gray1;
    .icon {
      &--clear:before {
        color: $gray1;
      }
      &--back:before {
        color: $gray1;
      }
    }
  }

  &--disabled {
    cursor: not-allowed;
    background-color: transparent;
    border-color: $gray3;
    color: $gray3;
    .icon {
      &--clear:before,
      &--back:before {
        color: $gray3;
      }
    }
  }
}
</style>
