<template>
  <div class="search-bar">
    <form ref="form" :class="formClasses" @submit.prevent="onFormSubmit">
      <span class="search-bar__prefix">
        <SearchIcon />
      </span>
      <input
        ref="input"
        v-model="searchValue"
        class="search-bar__input"
        type="text"
        autocomplete="off"
        placeholder="search this AppMap..."
        @focus="onInputFocus"
      />
      <span v-if="searchValue" class="search-bar__suffix" @click="clearValue">
        <CloseThinIcon />
      </span>
      <ul ref="suggestionsList" v-if="suggestionsList.length" class="search-bar__suggestions">
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
    <div class="search-bar__arrows" v-if="nodesLength">
      <div class="search-bar__arrow search-bar__arrow-previous" @click="onPrevArrow">
        <ArrowSearchLeftIcon />
      </div>
      <div class="search-bar__arrows-text">
        <span v-if="Number.isInteger(currentIndex)">
          <b>{{ currentIndex + 1 }}</b>
          /
        </span>
        {{ nodesLength }} results
      </div>
      <div class="search-bar__arrow search-bar__arrow-next" @click="onNextArrow">
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
  name: 'v-search-bar',

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
      default: undefined,
    },
    suggestions: {
      type: Array,
      default: () => [],
    },
    initialSearchValue: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      searchValue: this.initialSearchValue,
      showSuggestions: false,
      selectedSuggestion: false,
    };
  },

  watch: {
    searchValue: {
      handler(value) {
        this.$emit('onChange', value);
      },
    },
    selectedSuggestion: {
      handler(selectedSuggestion) {
        if (selectedSuggestion === false) {
          return;
        }

        const selected = this.$refs.suggestionsList?.querySelectorAll('li')[selectedSuggestion];
        if (!selected) return;

        if (selected.offsetTop < this.$refs.suggestionsList.scrollTop) {
          this.$refs.suggestionsList.scrollTop = selected.offsetTop;
        } else if (
          selected.offsetTop >=
          this.$refs.suggestionsList.scrollTop + this.$refs.suggestionsList.offsetHeight - 2
        ) {
          this.$refs.suggestionsList.scrollTop = selected.offsetTop - selected.offsetHeight * 4;
        }
      },
    },
  },

  computed: {
    formClasses() {
      const classList = ['search-bar__form'];

      if (this.showSuggestions && this.suggestionsList.length) {
        classList.push('search-bar__form--show-suggestions');
      }

      return classList;
    },
    suggestionsList() {
      let { suggestions } = this;
      const lastTermRegex = this.searchValue.includes('"') ? /([^"]*)$/ : /([^\s]*)$/;
      const lastTerm = this.searchValue.match(lastTermRegex).pop().trim();

      if (
        lastTerm &&
        !/^".+"$/g.test(lastTerm) &&
        !/^id:.+$/g.test(lastTerm) &&
        !/^label:.+$/g.test(lastTerm)
      ) {
        suggestions = suggestions.filter((item) => new RegExp(lastTerm, 'ig').test(item));
      }

      return suggestions;
    },
  },

  methods: {
    setValue(newValue) {
      this.searchValue = newValue;
    },
    clearValue() {
      this.$emit('clearSearchBar');
      this.searchValue = '';
    },
    onPrevArrow() {
      this.$emit('onPrevArrow');
    },
    onNextArrow() {
      this.$emit('onNextArrow');
    },
    getSuggestionClasses(index) {
      const classes = ['search-bar__suggestions-item'];
      if (index === this.selectedSuggestion) {
        classes.push('search-bar__suggestions-item--selected');
      }
      return classes;
    },
    onInputFocus() {
      this.showSuggestions = true;
      this.selectedSuggestion = false;
    },
    onFormSubmit() {
      if (
        this.isInputFocused() &&
        this.showSuggestions &&
        this.suggestionsList.length &&
        this.selectedSuggestion !== false
      ) {
        this.makeSelection(this.suggestionsList[this.selectedSuggestion].toString());
      }

      this.$refs.input.blur();
      if (!this.searchValue.endsWith(' ')) this.searchValue += ' ';
      this.showSuggestions = false;
      this.$emit('makeSelection');
    },
    makeSelection(eventName) {
      const terms = this.searchValue.match(/(?:[^\s"]+|"[^"]*")+/g);
      const lastTerm = terms ? terms[terms.length - 1] : null;
      if (
        !this.searchValue.endsWith(' ') &&
        lastTerm &&
        !/^".+"$/g.test(lastTerm) &&
        !/^id:.+$/g.test(lastTerm) &&
        !/^label:.+$/g.test(lastTerm)
      ) {
        terms.pop();
      }
      this.searchValue = `${terms ? `${terms.join(' ')} ` : ''}"${eventName}" `;
      this.showSuggestions = false;
      this.$emit('makeSelection');
    },
    incrementSelectedSuggestion() {
      if (this.selectedSuggestion !== false && this.selectedSuggestion !== 0) {
        this.selectedSuggestion -= 1;
      } else {
        this.selectedSuggestion = this.suggestionsList.length - 1;
      }
    },
    decrementSelectedSuggestion() {
      if (
        this.selectedSuggestion !== false &&
        this.selectedSuggestion !== this.suggestionsList.length - 1
      ) {
        this.selectedSuggestion += 1;
      } else {
        this.selectedSuggestion = 0;
      }
    },
    isInputFocused() {
      return this.$refs.input === window?.document?.activeElement;
    },
    onWindowClick(event) {
      if (!getEventTarget(event.target, this.$refs.form)) {
        if (this.$refs.input !== window.document.activeElement) this.showSuggestions = false;

        if (
          !event.target.classList.contains('search-bar__suggestions-item') &&
          !this.searchValue.endsWith(' ')
        )
          this.searchValue += ' ';
      }
    },
    onWindowKeyUp() {
      if (!this.isInputFocused()) return;
    },
    onWindowKeyDown(event) {
      // prevent the cursor from moving when using the up and down arrow keys
      if (this.isInputFocused() && ['ArrowUp', 'ArrowDown'].includes(event.key))
        event.preventDefault();

      if (!this.isInputFocused()) return;

      switch (event.key) {
        case 'Escape':
          this.showSuggestions = false;
          this.$refs.input.blur();
          if (!this.searchValue.endsWith(' ')) this.searchValue += ' ';
          break;
        case 'ArrowDown':
          this.decrementSelectedSuggestion();
          break;
        case 'ArrowUp':
          this.incrementSelectedSuggestion();
          break;
      }
    },
  },

  created() {
    window.addEventListener('click', this.onWindowClick);
    window.addEventListener('keyup', this.onWindowKeyUp, true);
    window.addEventListener('keydown', this.onWindowKeyDown, true);
  },

  destroyed() {
    window.removeEventListener('click', this.onWindowClick);
    window.removeEventListener('keyup', this.onWindowKeyUp, true);
    window.removeEventListener('keydown', this.onWindowKeyDown, true);
  },
};
</script>

<style lang="scss">
.search-bar {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  font-family: $appland-text-font-family;

  &__form {
    flex: 1;
    position: relative;
    border-radius: $border-radius;
    border: 1px solid $gray4;

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
    font-size: 0.9rem;
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

    .search-bar__form--show-suggestions & {
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
