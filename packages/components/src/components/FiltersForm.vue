<template>
  <form :class="classes" @submit.prevent="onFormSubmit">
    <input
      class="filters__form-input"
      type="text"
      :placeholder="placeholder"
      ref="input"
      v-model="inputValue"
      @focus="onInputFocus"
    />
    <PlusIcon class="filters__form-plus" @click="onFormSubmit" />
    <ul v-if="suggestionsList.length" class="filters__form-suggestions">
      <li
        class="filters__form-suggestions-item"
        v-for="item in suggestionsList"
        :key="item"
        @click="makeSelection"
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
    };
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
    onInputFocus() {
      this.showSuggestions = true;
    },
    onFormSubmit() {
      this.showSuggestions = false;
      this.onSubmit(this.$refs.input.value);
      this.$refs.input.value = '';
    },
    makeSelection(event) {
      this.$refs.input.value = event.target.textContent;
      this.onFormSubmit();
    },
  },

  mounted() {
    window.addEventListener('click', (event) => {
      if (!getEventTarget(event.target, this.$el)) {
        this.showSuggestions = false;
      }
    });
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
  background: #191919;

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
    border-top: 1px solid #2c2b32;
    margin: 0;
    padding: 0;
    max-height: 66px;
    list-style: none;
    overflow-x: hidden;
    overflow-y: auto;
    background: #191919;
    z-index: 1000;

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

      &:hover,
      &:active {
        color: $gray6;
        background-color: $base19;
      }
    }
  }
}
</style>
