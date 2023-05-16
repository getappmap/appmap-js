<template>
  <div class="filters">
    <div class="filters__head">
      <FilterIcon class="filters__head-icon" />
      <h2 class="filters__head-text">Filters</h2>
      <button class="filters__head-reset" @click="resetFilters">
        Reset all
        <ResetIcon />
      </button>
    </div>
    <div class="filters__block">
      <div class="filters__block-head">
        <h3 class="filters__block-title">Root</h3>
        <v-filters-form
          :onSubmit="addRootObject"
          placeholder="add new root..."
          :suggestions="rootObjectsSuggestions"
        />
      </div>
      <div class="filters__block-body filters__block-body--flex" v-if="filters.rootObjects.length">
        <div class="filters__root" v-for="(id, index) in filters.rootObjects" :key="id">
          {{ id }}
          <CloseThinIcon class="filters__root-icon" @click.stop="removeRootObject(index)" />
        </div>
      </div>
    </div>
    <div class="filters__block">
      <div class="filters__block-head">
        <h3 class="filters__block-title">Declutter</h3>
      </div>
      <div class="filters__block-body">
        <div class="filters__block-row">
          <label class="filters__checkbox">
            <input type="checkbox" v-model="limitRootEvents" />
            <CheckIcon class="filters__checkbox-icon" />
          </label>
          <div class="filters__block-row-content">Limit root events to HTTP</div>
        </div>
        <div class="filters__block-row">
          <label class="filters__checkbox">
            <input type="checkbox" v-model="hideMediaRequests" />
            <CheckIcon class="filters__checkbox-icon" />
          </label>
          <div class="filters__block-row-content">Hide media HTTP requests</div>
        </div>
        <div class="filters__block-row" v-if="hideExternalSupported">
          <label class="filters__checkbox">
            <input type="checkbox" v-model="hideExternal" />
            <CheckIcon class="filters__checkbox-icon" />
          </label>
          <div class="filters__block-row-content">Hide external code</div>
        </div>
        <div class="filters__block-row">
          <label class="filters__checkbox">
            <input type="checkbox" v-model="hideUnlabeled" />
            <CheckIcon class="filters__checkbox-icon" />
          </label>
          <div class="filters__block-row-content">Hide unlabeled</div>
        </div>
        <div class="filters__block-row">
          <label class="filters__checkbox">
            <input type="checkbox" v-model="hideElapsedTimeUnder" />
            <CheckIcon class="filters__checkbox-icon" />
          </label>
          <div class="filters__block-row-content">
            Hide elapsed time under:
            <div class="filters__elapsed">
              <input type="text" class="filters__elapsed-input" v-model="hideElapsedTime" />
              <span class="filters__elapsed-ms">ms</span>
            </div>
          </div>
        </div>
        <div class="filters__block-row">
          <label class="filters__checkbox">
            <input type="checkbox" v-model="hideName" />
            <CheckIcon class="filters__checkbox-icon" />
          </label>
          <div class="filters__block-row-content">
            Hide name:
            <v-filters-form
              :onSubmit="addHiddenName"
              placeholder="find names..."
              :suggestions="hideNamesSuggestions"
              suggestions-placement="top"
            />
            <div class="filters__hide" v-if="hiddenNames.length">
              <div class="filters__hide-item" v-for="(name, index) in hiddenNames" :key="name">
                {{ name }}
                <CloseThinIcon
                  class="filters__hide-item-icon"
                  @click.stop="removeHiddenName(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VFiltersForm from './FiltersForm.vue';
import CheckIcon from '@/assets/check.svg';
import CloseThinIcon from '@/assets/close-thin.svg';
import FilterIcon from '@/assets/filter.svg';
import ResetIcon from '@/assets/reset.svg';
import {
  SET_DECLUTTER_ON,
  SET_ELAPSED_TIME,
  RESET_FILTERS,
  ADD_ROOT_OBJECT,
  REMOVE_ROOT_OBJECT,
  ADD_HIDDEN_NAME,
  REMOVE_HIDDEN_NAME,
} from '@/store/vsCode';

export default {
  name: 'v-filter-menu',

  components: {
    VFiltersForm,
    CheckIcon,
    CloseThinIcon,
    FilterIcon,
    ResetIcon,
  },

  props: {
    filteredAppMap: {
      type: Object,
      required: true,
    },
  },

  computed: {
    filters() {
      return this.$store.state.filters;
    },

    limitRootEvents: {
      get() {
        return this.$store.state.filters.declutter.limitRootEvents.on;
      },
      set(value) {
        this.$store.commit(SET_DECLUTTER_ON, { declutterProperty: 'limitRootEvents', value });
      },
    },

    hideMediaRequests: {
      get() {
        return this.$store.state.filters.declutter.hideMediaRequests.on;
      },
      set(value) {
        this.$store.commit(SET_DECLUTTER_ON, { declutterProperty: 'hideMediaRequests', value });
      },
    },

    hideUnlabeled: {
      get() {
        return this.$store.state.filters.declutter.hideUnlabeled.on;
      },
      set(value) {
        this.$store.commit(SET_DECLUTTER_ON, { declutterProperty: 'hideUnlabeled', value });
      },
    },

    hideExternal: {
      get() {
        return this.$store.state.filters.declutter.hideExternalPaths.on;
      },
      set(value) {
        this.$store.commit(SET_DECLUTTER_ON, { declutterProperty: 'hideExternalPaths', value });
      },
    },

    hideElapsedTimeUnder: {
      get() {
        return this.$store.state.filters.declutter.hideElapsedTimeUnder.on;
      },
      set(value) {
        this.$store.commit(SET_DECLUTTER_ON, { declutterProperty: 'hideElapsedTimeUnder', value });
      },
    },

    hideElapsedTime: {
      get() {
        return this.$store.state.filters.declutter.hideElapsedTimeUnder.time;
      },
      set(value) {
        this.$store.commit(SET_ELAPSED_TIME, value);
      },
    },

    hideName: {
      get() {
        return this.$store.state.filters.declutter.hideName.on;
      },
      set(value) {
        this.$store.commit(SET_DECLUTTER_ON, { declutterProperty: 'hideName', value });
      },
    },

    hiddenNames() {
      return this.$store.state.filters.declutter.hideName.names;
    },

    rootObjectsSuggestions() {
      return this.$store.state.appMap.classMap.codeObjects
        .map((co) => co.fqid)
        .filter((fqid) => !this.filters.rootObjects.includes(fqid));
    },

    hideNamesSuggestions() {
      return this.filteredAppMap.classMap.codeObjects
        .map((co) => co.fqid)
        .filter((fqid) => !this.filters.declutter.hideName.names.includes(fqid));
    },

    hideExternalSupported() {
      const { appMap } = this.$store.state;
      return (
        appMap.metadata &&
        appMap.metadata.language &&
        ['ruby', 'javascript'].includes(appMap.metadata.language.name)
      );
    },
  },

  methods: {
    resetFilters() {
      this.$store.commit(RESET_FILTERS);
    },

    addRootObject(fqid) {
      this.$store.commit(ADD_ROOT_OBJECT, fqid);
    },

    removeRootObject(index) {
      this.$store.commit(REMOVE_ROOT_OBJECT, index);
    },

    addHiddenName(nameToAdd) {
      this.$store.commit(ADD_HIDDEN_NAME, nameToAdd);
    },

    removeHiddenName(index) {
      this.$store.commit(REMOVE_HIDDEN_NAME, index);

      if (this.filters.declutter.hideName.names.length === 0)
        this.$store.commit(SET_DECLUTTER_ON, { declutterProperty: 'hideName', value: false });
    },
  },
};
</script>

<style scoped lang="scss">
.filters {
  width: 390px;
  font-size: 0.75rem;

  &__head {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid $gray2;
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
      color: $light-purple;
    }

    &-text {
      margin-bottom: 0;
      color: $base01;
      text-transform: uppercase;
      font-size: 0.75rem;
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

  &__block {
    &:not(:last-child) {
      margin-bottom: 1rem;
    }

    &-head {
      border-radius: 0.25rem 0.25rem 0 0;
      margin-bottom: 1px;
      display: flex;
      padding: 0.5rem 0rem;
      line-height: 1.25rem;
      border-bottom: 1px solid lighten($gray2, 15);
    }

    &-title {
      margin: 0 0.5rem 0 0;
      display: inline-block;
      font-size: 0.875rem;
      font-weight: bold;
      color: $base06;
    }

    &-body {
      border-radius: 0 0 0.25rem 0.25rem;
      padding: 1rem 0.75rem;
      &--flex {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
    }

    &-row {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;

      &:not(:last-child) {
        margin-bottom: 1rem;
      }

      &-content {
        margin-left: 1rem;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        line-height: 22px;
      }
    }
  }

  &__root {
    border-radius: $border-radius;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: $light-purple;
    color: $gray6;
    line-height: 1;

    &-icon {
      flex-shrink: 0;
      margin-left: 1rem;
      width: 1em;
      height: 1em;
      fill: currentColor;
      cursor: pointer;
    }
  }

  &__checkbox {
    flex-shrink: 0;
    margin: 3px 0;
    border-radius: 2px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 1rem;
    height: 1rem;
    background: $light-purple;
    cursor: pointer;

    input {
      position: absolute;
      overflow: hidden;
      clip: rect(1px, 1px, 1px, 1px);
      height: 1px;
      width: 1px;
      margin: -1px;
      padding: 0;
      border: 0;

      &:checked + .filters__checkbox-icon {
        display: block;
      }
    }

    &-icon {
      display: none;
      width: 0.5rem;
      height: 0.5rem;
      fill: $base03;
    }
  }

  &__elapsed {
    margin-left: 0.5rem;
    border-radius: 0.25rem;
    display: inline-block;
    vertical-align: middle;
    height: 22px;
    padding: 0 0.25rem;
    //border: 1px solid $gray2;
    background: darken($gray4, 50);

    &-input {
      display: inline-block;
      vertical-align: middle;
      width: 2rem;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      background: transparent;
      font: inherit;
      color: inherit;
      outline: none;
    }

    &-ms {
      color: $lightgray2;
    }
  }

  &__hide {
    margin-top: 0.75rem;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 0.5rem;

    &-item {
      border-radius: 0.25rem;
      display: inline-flex;
      justify-content: flex-start;
      align-items: center;
      padding: 5px 10px;
      background: $light-purple;
      color: $gray6;
      line-height: 1;

      &-icon {
        flex-shrink: 0;
        margin-left: 1rem;
        width: 1em;
        height: 1em;
        fill: currentColor;
        cursor: pointer;
      }
    }
  }
}
</style>
