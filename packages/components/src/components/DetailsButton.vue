<template>
  <button type="button" :class="classes">
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
    additionalClass: {
      type: String,
      required: false,
      default: '',
    },
  },

  computed: {
    iconClass() {
      return `icon icon--${this.icon}`;
    },
    classes() {
      return `details-btn ${this.additionalClass || ''}`;
    },
  },
};
</script>

<style scoped lang="scss">
.details-btn {
  display: flex;
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
  outline: none;
  text-align: left;
  align-items: center;

  &:hover {
    background-color: darken($vs-code-gray1, 03);
    border-color: darken($vs-code-gray1, 03);
  }

  & + & {
    margin-top: 1rem;
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
