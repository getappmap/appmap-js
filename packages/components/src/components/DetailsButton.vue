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
  border: 1px solid $base15;
  border-radius: $border-radius;
  padding: 0.25rem 0.6rem 0.25rem 0.5rem;
  letter-spacing: 0.5px;
  color: $base10;
  background-color: transparent;
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  outline: none;
  text-align: left;
  align-items: center;

  &:hover {
    background-color: darken($vs-code-gray1, 03);
    border-color: darken($vs-code-gray1, 03);
  }
}

.icon {
  margin-right: 0.5em;

  &--clear:before {
    content: '✖ ';
  }

  &--back:before {
    content: '◄ ';
  }
}
</style>
