<template>
  <div class="trace-filter">
    <form ref="form" :class="formClasses" @submit.prevent="onFormSubmit">
      <span class="trace-filter__prefix">
        <SearchIcon />
      </span>
      <input
        ref="input"
        v-model="filterValue"
        class="trace-filter__input"
        type="text"
        autocomplete="off"
        placeholder="search events..."
        @focus="onInputFocus"
      />
      <span v-if="filterValue" class="trace-filter__suffix" @click="clearValue">
        <CloseThinIcon />
      </span>
      <ul
        ref="suggestionsList"
        v-if="suggestionsList.length"
        class="trace-filter__suggestions"
      >
        <li
          :class="getSuggestionClasses(index)"
          v-for="(item, index) in suggestionsList"
          :key="item"
          @click.stop="makeSelection(item)"
        >
          {{ item }}
        </li>
      </ul>
    </form>
    <div class="trace-filter__arrows" v-if="nodesLength">
      <div class="trace-filter__arrow" @click="onPrevArrow">
        <ArrowSearchLeftIcon />
      </div>
      <div class="trace-filter__arrows-text">
        <span v-if="Number.isInteger(currentIndex)">
          <b>{{ currentIndex + 1 }}</b>
          /
        </span>
        {{ nodesLength }} results
      </div>
      <div class="trace-filter__arrow" @click="onNextArrow">
        <ArrowSearchRightIcon />
      </div>
    </div>
  </div>
</template>

<script>
import ArrowSearchLeftIcon from '@/assets/arrow-search-left.svg';
import ArrowSearchRightIcon from '@/assets/arrow-search-right.svg';
import CloseThinIcon from '@/assets/close-thin.svg';
import SearchIcon from '@/assets/search.svg';
import { getEventTarget } from '@appland/diagrams';

export default {
  name: 'v-trace-filter',

  components: {
    ArrowSearchLeftIcon,
    ArrowSearchRightIcon,
    CloseThinIcon,
    SearchIcon,
  },

  props: {
    nodesLength: {
      type: Number,
      require: false,
      default: 0,
    },
    currentIndex: {
      type: Number,
      default: null,
    },
    suggestions: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      filterValue: '',
      showSuggestions: false,
      selectedSuggestion: false,
    };
  },

  watch: {
    filterValue: {
      handler(value) {
        this.$emit('onChange', value);
      },
    },
    selectedSuggestion: {
      handler(selectedSuggestion) {
        if (selectedSuggestion === false) {
          return;
        }

        const selected =
          this.$refs.suggestionsList.querySelectorAll('li')[selectedSuggestion];

        if (selected.offsetTop < this.$refs.suggestionsList.scrollTop) {
          this.$refs.suggestionsList.scrollTop = selected.offsetTop;
        } else if (
          selected.offsetTop >=
          this.$refs.suggestionsList.scrollTop +
            this.$refs.suggestionsList.offsetHeight -
            2
        ) {
          this.$refs.suggestionsList.scrollTop =
            selected.offsetTop - selected.offsetHeight * 4;
        }
      },
    },
  },

  computed: {
    formClasses() {
      const classList = ['trace-filter__form'];

      if (this.showSuggestions && this.suggestionsList.length) {
        classList.push('trace-filter__form--show-suggestions');
      }

      return classList;
    },
    suggestionsList() {
      let suggestions = this.suggestions
        .map((e) => e.toString())
        .filter((e, i, arr) => arr.indexOf(e) === i);

      const terms = this.filterValue.match(/(?:[^\s"]+|"[^"]*")+/g);
      const lastTerm = terms ? terms[terms.length - 1] : null;
      if (
        lastTerm &&
        !/^".+"$/g.test(lastTerm) &&
        !/^%.+%$/g.test(lastTerm) &&
        !/^id:.+$/g.test(lastTerm) &&
        !/^label:.+$/g.test(lastTerm)
      ) {
        suggestions = suggestions.filter((item) =>
          new RegExp(lastTerm, 'ig').test(item)
        );
      }

      return suggestions;
    },
  },

  methods: {
    setValue(newValue) {
      this.filterValue = newValue;
    },
    clearValue() {
      this.filterValue = '';
    },
    onPrevArrow() {
      this.$emit('onPrevArrow');
    },
    onNextArrow() {
      this.$emit('onNextArrow');
    },
    getSuggestionClasses(index) {
      const classes = ['trace-filter__suggestions-item'];
      if (index === this.selectedSuggestion) {
        classes.push('trace-filter__suggestions-item--selected');
      }
      return classes;
    },
    onInputFocus() {
      this.showSuggestions = true;
      this.selectedSuggestion = false;
    },
    onFormSubmit() {
      if (
        this.$refs.input === window.document.activeElement &&
        this.showSuggestions &&
        this.suggestionsList.length &&
        this.selectedSuggestion !== false
      ) {
        this.makeSelection(
          this.suggestionsList[this.selectedSuggestion].toString()
        );
      }

      this.$refs.input.blur();
      this.showSuggestions = false;
    },
    makeSelection(eventName) {
      const terms = this.filterValue.match(/(?:[^\s"]+|"[^"]*")+/g);
      const lastTerm = terms ? terms[terms.length - 1] : null;
      if (
        lastTerm &&
        !/^".+"$/g.test(lastTerm) &&
        !/^%.+%$/g.test(lastTerm) &&
        !/^id:.+$/g.test(lastTerm) &&
        !/^label:.+$/g.test(lastTerm)
      ) {
        terms.pop();
      }
      this.filterValue = `${
        terms ? terms.join(' ') : ''
      } "${eventName}"`.trim();
    },
    onWindowClick(event) {
      if (
        !getEventTarget(event.target, this.$refs.form) &&
        this.$refs.input !== window.document.activeElement
      ) {
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
          this.$refs.input.blur();
          break;
        case 'ArrowDown':
          if (
            this.selectedSuggestion !== false &&
            this.selectedSuggestion !== this.suggestionsList.length - 1
          ) {
            this.selectedSuggestion += 1;
          } else {
            this.selectedSuggestion = 0;
          }
          break;
        case 'ArrowUp':
          if (
            this.selectedSuggestion !== false &&
            this.selectedSuggestion !== 0
          ) {
            this.selectedSuggestion -= 1;
          } else {
            this.selectedSuggestion = this.suggestionsList.length - 1;
          }
          break;
        default:
          this.selectedSuggestion = false;
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

<style lang="scss">
.trace-filter {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  font-family: $appland-text-font-family;

  &__form {
    flex: 1;
    position: relative;
    border-radius: $border-radius;
    border: 2px solid $light-purple;

    &--show-suggestions {
      border-radius: $border-radius $border-radius 0 0;
    }
  }

  &__prefix {
    position: absolute;
    top: 50%;
    left: 0;
    width: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    transform: translateY(-50%);
    text-align: center;
    color: $base06;

    svg {
      position: relative;
      left: 3px;
      width: 14px;
      height: 14px;
      fill: $lightgray2;
    }
  }

  &__input {
    border: none;
    width: 100%;
    padding: 0.5rem 2rem;
    font: inherit;
    font-size: 0.75rem;
    color: $base03;
    background: transparent;
    outline: none;

    &::-webkit-placeholder,
    &::-moz-placeholder,
    &::placeholder {
      color: $gray4;
    }
  }

  &__suffix {
    position: absolute;
    top: 50%;
    right: 5px;
    width: 1rem;
    height: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    transform: translateY(-50%);
    text-align: center;
    color: $lightgray2;
    transition: color 0.3s ease-in;
    cursor: pointer;

    &:hover,
    &:active {
      color: $gray5;
      transition-timing-function: ease-out;
    }

    svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
    }
  }

  &__suggestions {
    display: none;
    position: absolute;
    top: 100%;
    left: -2px;
    right: -2px;
    border-radius: 0 0 $border-radius $border-radius;
    border: 2px solid $light-purple;
    border-top: 1px solid #2c2b32;
    margin: 0;
    padding: 0;
    max-height: 112px;
    list-style: none;
    overflow-x: hidden;
    overflow-y: auto;
    background: #191919;
    z-index: 1;

    .trace-filter__form--show-suggestions & {
      display: block;
    }

    &-item {
      padding: 0 0.75rem;
      height: 22px;
      font-size: 12px;
      line-height: 22px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: $base09;
      cursor: pointer;

      &--selected,
      &:hover,
      &:active {
        color: $gray6;
        background-color: $base19;
      }
    }
  }

  &__arrows {
    display: flex;
    align-items: center;
    padding: 0 1.25rem;

    &-text {
      margin: 0 0.5rem;
      font-size: 0.75rem;
      color: $base06;
    }
  }

  &__arrow {
    padding: 0.25rem;
    font-size: 0;
    cursor: pointer;
  }
}
</style>
