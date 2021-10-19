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

  props: {},

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
      return this.filterItems;
    },
  },

  methods: {
    toggleFilter(key) {
      this.filterItems[key].isActive = !this.filterItems[key].isActive;
      this.$forceUpdate(); // temporary hack to re-render the component
    },
    resetFilters() {
      Object.keys(this.filterItems).forEach((key) => {
        this.filterItems[key].isActive = false;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.details-panel-filters {
  margin-bottom: 1rem;
  border-radius: 0.25rem;
  background: #2c2b32;
  font-size: 0.75rem;
  font-family: $appland-text-font-family;

  &__head {
    border-bottom: 1px solid #333a4d;
    padding: 0.25rem 0.75rem;
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
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: #494756;
    cursor: pointer;

    &:hover,
    &:active {
      color: $gray5;
    }

    &:not(:last-child) {
      border-bottom: 1px solid #333a4d;
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
