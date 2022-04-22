<template>
  <div class="details-panel-filters">
    <div class="details-panel-filters__head">
      <FilterIcon class="details-panel-filters__head-icon" />
      <span class="details-panel-filters__head-text">Filters</span>
      <button class="details-panel-filters__head-reset" @click="resetFilters()">
        Reset all
        <ResetIcon />
      </button>
    </div>
    <div
      class="details-panel-filters__item"
      :class="{ 'details-panel-filters__item--active': filters[key].isActive }"
      v-for="key in Object.keys(filters)"
      :key="key"
      @click="toggleFilter(key)"
    >
      {{ filters[key].title }}
    </div>
  </div>
</template>

<script>
import FilterIcon from '@/assets/filter.svg';
import ResetIcon from '@/assets/reset.svg';

export default {
  name: 'v-details-panel-filters',

  components: {
    FilterIcon,
    ResetIcon,
  },

  props: {
    object: {
      type: Object,
      required: true,
    },
    isRootObject: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  data() {
    return {
      filterItems: {
        setAsRoot: {
          isActive: false,
          title: 'Set as Root',
        },
        hide: {
          isActive: false,
          title: 'Hide',
        },
      },
    };
  },

  computed: {
    filters() {
      const { filterItems } = this;

      if (this.isRootObject) {
        filterItems.setAsRoot.isActive = true;
      }

      return filterItems;
    },
  },

  methods: {
    toggleFilter(key) {
      if (key === 'setAsRoot') {
        this.$root.$emit('makeRoot', this.object);
      }
      if (key === 'hide') {
        this.$root.$emit('addHiddenName', this.object.fqid);
      }
    },
    resetFilters() {
      this.$root.$emit('removeRoot', this.object.fqid);
    },
  },
};
</script>

<style lang="scss" scoped>
.details-panel-filters {
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: $appland-text-font-family;
  margin: 0 -1rem 1rem -1rem;

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
      font-weight: bold;
    }

    &-reset {
      margin-left: auto;
      border: none;
      display: inline-flex;
      align-items: center;
      padding: 0.25rem;
      background: transparent;
      color: $lightgray2;
      font: inherit;
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
    padding: 0.25rem 1rem;
    font-size: 0.875rem;
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

    &--active {
      color: $base06;

      &::before {
        border-color: $light-purple;
        background: $light-purple;
      }
    }
  }
}
</style>
