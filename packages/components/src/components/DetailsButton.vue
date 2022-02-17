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
      return `details-btn__icon details-btn__icon--${this.icon}`;
    },
  },
};
</script>

<style scoped lang="scss">
.details-btn {
  display: inline-flex;
  justify-content: flex-start;
  align-items: center;
  border: 1px solid $base15;
  border-radius: $border-radius;
  padding: 0.25rem 0.5rem;
  letter-spacing: 0.5px;
  color: $base10;
  background-color: transparent;
  font: inherit;
  font-size: 0.75rem;
  line-height: 14px;
  cursor: pointer;
  outline: none;
  text-align: left;
  align-items: center;

  &:hover {
    background-color: darken($vs-code-gray1, 03);
    border-color: darken($vs-code-gray1, 03);
  }

  &__icon {
    margin-right: 0.5em;
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    background-repeat: no-repeat;
    background-position: center center;

    &--back {
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 11 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m.954 7.687 8.667 6a.667.667 0 0 0 1.046-.548v-12A.667.667 0 0 0 9.62.591l-8.667 6a.669.669 0 0 0 0 1.096Z' fill='%23808080'/%3E%3C/svg%3E");
    }

    &--clear {
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M.646.785a.5.5 0 0 1 .708 0L4 3.432 6.646.785a.5.5 0 0 1 .708.708L4.707 4.14l2.647 2.646a.5.5 0 0 1-.708.708L4 4.846 1.354 7.493a.5.5 0 1 1-.708-.708L3.293 4.14.646 1.493a.5.5 0 0 1 0-.708Z' fill='%23808080'/%3E%3C/svg%3E");
      transform: scale(0.8);
    }

    &--source {
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 12 17' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 .14H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2Zm-7 4h6a.5.5 0 1 1 0 1H3a.5.5 0 1 1 0-1Zm-.5 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1H3a.5.5 0 0 1-.5-.5Zm.5 1.5h6a.5.5 0 1 1 0 1H3a.5.5 0 1 1 0-1Zm0 2h3a.5.5 0 0 1 0 1H3a.5.5 0 0 1 0-1Z' fill='%23808080'/%3E%3C/svg%3E");
    }

    &--trace {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 461.312 461.312'%3E%3Cpath d='M230.656 156.416c-40.96 0-74.24 33.28-74.24 74.24s33.28 74.24 74.24 74.24 74.24-33.28 74.24-74.24-33.28-74.24-74.24-74.24zm-5.632 52.224c-9.216 0-16.896 7.68-16.896 16.896h-24.576c.512-23.04 18.944-41.472 41.472-41.472v24.576z' fill='%23808080'/%3E%3Cpath d='M455.936 215.296c-25.088-31.232-114.688-133.12-225.28-133.12S30.464 184.064 5.376 215.296c-7.168 8.704-7.168 21.504 0 30.72 25.088 31.232 114.688 133.12 225.28 133.12s200.192-101.888 225.28-133.12c7.168-8.704 7.168-21.504 0-30.72zm-225.28 122.88c-59.392 0-107.52-48.128-107.52-107.52s48.128-107.52 107.52-107.52 107.52 48.128 107.52 107.52-48.128 107.52-107.52 107.52z' fill='%23808080'/%3E%3C/svg%3E");
    }
  }
}
</style>
