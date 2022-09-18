<template>
  <form :class="classes" @submit.prevent="onFormSubmit">
    <input
      ref="input"
      class="filters__form-input"
      type="text"
      :placeholder="placeholder"
      v-model="inputValue"
      @focus="onInputFocus"
    />
    <PlusIcon class="filters__form-plus" @click="onFormSubmit" />
    <ul ref="suggestionsList" v-if="suggestionsList.length" class="filters__form-suggestions">
      <li
        :class="getSuggestionClasses(index)"
        v-for="(item, index) in suggestionsList"
        :key="item"
        @click.stop="makeSelection"
        :data-index="index"
      >
        {{ item }}
      </li>
    </ul>
  </form>
</template>

<script>
import { getEventTarget } from '@appland/diagrams';
import PlusIcon from '@/assets/plus.svg';

export default {
  name: 'v-filters-form',

  components: {
    PlusIcon,
  },

  props: {
    onSubmit: {
      type: Function,
      required: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
    suggestions: {
      type: Array,
      default: () => [],
    },
    suggestionsPlacement: {
      type: String,
      default: 'bottom',
      validator: (value) => ['top', 'bottom'].indexOf(value) !== -1,
    },
  },

  data() {
    return {
      showSuggestions: false,
      inputValue: '',
      selectedSuggestion: 0,
    };
  },

  watch: {
    selectedSuggestion: {
      handler(selectedSuggestion) {
        const selected = this.$refs.suggestionsList.querySelectorAll('li')[selectedSuggestion];

        if (selected.offsetTop < this.$refs.suggestionsList.scrollTop) {
          this.$refs.suggestionsList.scrollTop = selected.offsetTop;
        } else if (
          selected.offsetTop >=
          this.$refs.suggestionsList.scrollTop + this.$refs.suggestionsList.offsetHeight
        ) {
          this.$refs.suggestionsList.scrollTop = selected.offsetTop - selected.offsetHeight * 2;
        }
      },
    },
  },

  computed: {
    classes() {
      const classList = ['filters__form'];
      if (this.showSuggestions && this.suggestionsList.length) {
        classList.push('filters__form--show-suggestions');
      }
      if (this.suggestionsPlacement === 'top') {
        classList.push('filters__form--suggestions-top');
      }
      return classList;
    },
    suggestionsList() {
      return this.inputValue
        ? this.suggestions.filter((item) =>
            item.toLowerCase().includes(this.inputValue.toLowerCase())
          )
        : this.suggestions;
    },
  },

  methods: {
    getSuggestionClasses(index) {
      const classes = ['filters__form-suggestions-item'];
      if (index === this.selectedSuggestion) {
        classes.push('filters__form-suggestions-item--selected');
      }
      return classes;
    },
    onInputFocus() {
      this.showSuggestions = true;
      this.selectedSuggestion = 0;
    },
    onFormSubmit() {
      if (
        this.$refs.input === window.document.activeElement &&
        this.showSuggestions &&
        this.suggestionsList.length
      ) {
        this.inputValue = this.suggestionsList[this.selectedSuggestion];
      }

      const value = this.inputValue.trim();
      this.showSuggestions = false;

      this.inputValue = '';

      if (value) {
        this.showSuggestions = false;
        this.onSubmit(value);
      } else {
        this.showSuggestions = true;
      }
    },
    makeSelection(event) {
      this.inputValue = event.target.textContent;
      this.onFormSubmit();
    },
    onWindowClick(event) {
      if (!getEventTarget(event.target, this.$el)) {
        this.showSuggestions = false;
      }
    },
    onWindowKeyUp(event) {
      if (this.$refs.input !== window.document.activeElement) {
        return;
      }

      switch (event.key) {
        case 'Escape':
          this.showSuggestions = false;
          break;
        case 'ArrowDown':
          if (this.selectedSuggestion !== this.suggestionsList.length - 1) {
            this.selectedSuggestion += 1;
          }
          break;
        case 'ArrowUp':
          if (this.selectedSuggestion !== 0) {
            this.selectedSuggestion -= 1;
          }
          break;
        default:
          break;
      }
    },
  },

  created() {
    window.addEventListener('click', this.onWindowClick);
    window.addEventListener('keyup', this.onWindowKeyUp, true);
  },

  destroyed() {
    window.removeEventListener('click', this.onWindowClick);
    window.removeEventListener('keyup', this.onWindowKeyUp, true);
  },
};
</script>

<style scoped lang="scss">
.filters__form {
  position: relative;
  flex: 1;
  margin-left: 0.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  height: 22px;
  padding: 0 0.5rem;
  border: 1px solid $gray2;
  background: $black;

  &--show-suggestions {
    border-radius: 0.25rem 0.25rem 0 0;

    &.filters__form--suggestions-top {
      border-radius: 0 0 0.25rem 0.25rem;
    }
  }

  &-input {
    flex: 1;
    display: inline-block;
    vertical-align: middle;
    width: 100%;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    font: inherit;
    color: inherit;
    outline: none;
  }

  &-plus {
    flex-shrink: 0;
    margin-left: 1rem;
    width: 1em;
    height: 1em;
    fill: $base12;
    cursor: pointer;
  }

  &-suggestions {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    border-radius: 0 0 0.25rem 0.25rem;
    border: 1px solid $gray2;
    margin: 0;
    padding: 0;
    max-height: 66px;
    list-style: none;
    overflow-x: hidden;
    overflow-y: auto;
    z-index: 1000;
    background: $black;

    .filters__form--show-suggestions & {
      display: block;
    }

    .filters__form--suggestions-top & {
      top: auto;
      bottom: 100%;
      border-radius: 0.25rem 0.25rem 0 0;
    }

    &-item {
      padding: 0 0.5rem;
      height: 22px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: $base09;
      cursor: pointer;

      &--selected,
      &:hover,
      &:active {
        color: $gray6;
        background-color: $gray2;
      }
    }
  }
}
</style>
