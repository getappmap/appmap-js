<template>
  <div v-if="!isPrecomputedSequenceDiagram" class="details-panel-filters">
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
      :class="{ 'details-panel-filters__item--active': isRootObject }"
      @click="toggleRootObject()"
    >
      Set as root
    </div>
    <div class="details-panel-filters__item" @click="hideObject()">Hide</div>
  </div>
</template>

<script>
import FilterIcon from '@/assets/filter.svg';
import ResetIcon from '@/assets/reset.svg';
import isPrecomputedSequenceDiagram from '@/lib/isPrecomputedSequenceDiagram';
import { mapActions } from 'vuex';

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
    filterDisabled: {
      type: Boolean,
      default: false,
      readonly: true,
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
    isPrecomputedSequenceDiagram,
    isRootObject() {
      return this.$store.filters.rootObjects.some((rootObject) => rootObject === this.object);
    },
    classes() {
      return {
        'details-panel-filters--disabled': this.filterDisabled,
        'details-panel-filters__item--active': this.isRootObject,
      };
    },
  },

  methods: {
    ...mapActions(['hideObject', 'toggleFilterRootObject', 'removeFilterRootObject']),
    toggleRootObject() {
      this.toggleFilterRootObject(this.object.fqid);
    },
    hideObject() {
      this.hideObject(this.object.fqid);
    },
    resetFilters() {
      this.removeFilterRootObject(this.object.fqid);
    },
  },
};
</script>

<style lang="scss" scoped>
.details-panel-filters {
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
