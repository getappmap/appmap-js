<template>
  <div class="details-panel-context">
    <div class="details-panel-context__head">
      <span class="details-panel-context__head-text">AI Context</span>
      <button class="details-panel-context__head-reset" @click="resetContext()">
        Reset all
        <ResetIcon />
      </button>
    </div>
    <div
      class="details-panel-context__item"
      :class="{ 'details-panel-context__item--selected': isSelected }"
      @click="toggleContext()"
    >
      Include in Context
    </div>
  </div>
</template>

<script>
import ResetIcon from '@/assets/reset.svg';
import { RESET_AI_CONTEXT, TOGGLE_AI_CONTEXT } from '../store/vsCode';

export default {
  name: 'v-details-panel-context',

  components: {
    ResetIcon,
  },

  props: {
    object: {
      type: Object,
      required: true,
    },
  },

  computed: {
    isSelected() {
      return this.$store.state.aiContext.includes(this.object);
    },
  },

  methods: {
    toggleContext() {
      this.$store.commit(TOGGLE_AI_CONTEXT, this.object);
    },
    resetContext() {
      this.$store.commit(RESET_AI_CONTEXT);
    },
  },
};
</script>

<style lang="scss" scoped>
.details-panel-context {
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: $appland-text-font-family;
  width: 100%;
  margin-bottom: 1.5rem;

  &__head {
    border-bottom: 1px solid $gray2;
    padding: 0.25rem 1rem;
    display: flex;
    justify-content: flex-start;
    align-items: center;

    svg {
      width: 1em;
      height: 1em;
      fill: currentColor;
    }

    &-icon {
      margin-right: 0.75rem;
      color: $base03;
    }

    &-text {
      color: $base06;
      text-transform: uppercase;
      font-weight: 800;
      font-size: 0.9rem;
      color: $gray4;
    }

    &-reset {
      margin-left: auto;
      border: none;
      display: inline-flex;
      align-items: center;
      padding: 0.25rem;
      background: transparent;
      color: $gray4;
      outline: none;
      line-height: 1;
      appearance: none;
      cursor: pointer;
      transition: color 0.3s ease-in;

      &:hover,
      &:active {
        color: $gray5;
        transition-timing-function: ease-out;
      }

      svg {
        margin-left: 0.5rem;
      }
    }
  }

  &__item {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0.25rem;
    font-size: 0.9rem;
    line-height: 1.25rem;
    color: $gray4;
    cursor: pointer;

    &:hover,
    &:active {
      color: $gray5;
    }

    &:not(:last-child) {
      border-bottom: 1px solid $gray2;
    }

    &::before {
      content: '';
      display: inline-block;
      margin-right: 0.7rem;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      border: 1px solid currentColor;
    }

    &--selected {
      color: $base06;

      &::before {
        border-color: $light-purple;
        background: $light-purple;
      }
    }
  }
}
</style>
