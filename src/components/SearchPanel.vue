<template>
  <div class="search">
    <div class="search__form" ref="form">
      <div class="search__input-container">
        <input
          ref="input"
          class="search__input"
          type="text"
          placeholder="Filter the diagram by package, class or function"
          autocomplete="off"
          @input="onInputInput"
        />
        <div class="search__suggestions" hidden ref="suggestions" @click.stop>
          <div
            class="search__suggestions-block"
            v-for="group in suggestionsList"
            :key="group.title"
          >
            <p class="search__suggestions-block-title">{{ group.title }}</p>
            <ul class="search__suggestions-list">
              <li
                class="search__suggestions-item"
                v-for="item in group.items"
                :key="item"
                @click="addItem(item)"
              >
                {{ item }}
              </li>
            </ul>
          </div>
          <div
            class="search__suggestions-block"
            v-if="suggestionsList.length == 0"
          >
            No results found
          </div>
        </div>
      </div>
    </div>
    <div class="search__results" v-if="filterList.length">
      <ul class="search__results-list">
        <li
          class="search__results-item"
          v-for="(item, index) in filterList"
          :key="index"
        >
          <span>{{ item.name }}</span>
          <button
            class="search__results-item-btn"
            type="button"
            @click="deleteItem(index)"
          >
            ×
          </button>
        </li>
      </ul>
      <button class="search__results-clear-all" type="button" @click="clearAll">
        × Clear all
      </button>
    </div>
  </div>
</template>

<script>
import { SET_FILTERED_OBJECTS } from '../store/vsCode';

export default {
  name: 'v-search-panel',
  props: {
    appmap: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      filterList: [],
      suggestionsList: [],
      suggestionsTimeout: null,
    };
  },

  methods: {
    onInputInput() {
      const inputStr = this.$refs.input.value.trim();

      window.clearTimeout(this.suggestionsTimeout);

      if (inputStr.length > 2) {
        this.suggestionsTimeout = window.setTimeout(() => {
          this.makeSuggestions(inputStr);
          this.$refs.suggestions.removeAttribute('hidden');
        }, 300);
      } else {
        this.$refs.suggestions.setAttribute('hidden', '');
      }
    },

    clearInput() {
      window.clearTimeout(this.suggestionsTimeout);
      this.$refs.input.value = '';
      this.$refs.suggestions.setAttribute('hidden', '');
    },

    addItem(id) {
      this.clearInput();

      this.filterList.push({
        name: id,
      });
      this.$store.commit(SET_FILTERED_OBJECTS, this.filterList);
    },

    deleteItem(index) {
      this.filterList.splice(index, 1);
      this.$store.commit(SET_FILTERED_OBJECTS, this.filterList);
    },

    clearAll() {
      this.filterList = [];
      this.$store.commit(SET_FILTERED_OBJECTS, this.filterList);
    },

    makeSuggestions(inputStr) {
      const regex = new RegExp(inputStr.toLowerCase(), 'ig');
      const filtered = {
        package: {
          title: 'Packages',
          items: new Set(),
        },
        class: {
          title: 'Classes',
          items: new Set(),
        },
        function: {
          title: 'Functions',
          items: new Set(),
        },
      };

      this.appmap.classMap.codeObjects.forEach((obj) => {
        switch (obj.type) {
          case 'package':
          case 'class':
          case 'function':
            if (regex.test(obj.id)) {
              filtered[obj.type].items.add(obj.id);
            }
            break;
          default:
            break;
        }
      });

      this.suggestionsList = Object.values(filtered).filter(
        (group) => group.items.size
      );
    },
  },

  mounted() {
    document.addEventListener('click', () => {
      this.clearInput();
    });
  },
};
</script>

<style scoped lang="scss">
.search {
  background-color: $vs-code-gray1;
  font-family: sans-serif;
  color: $base03;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  padding: 1.5rem 2rem;
  transition: $transition;
  display: flex;
  flex-direction: column;

  &__input-container {
    position: relative;
    border: 1px solid $base15;
    border-radius: $border-radius;
  }

  &__input {
    position: relative;
    border: none;
    border-radius: $border-radius;
    padding: 0.5rem 1rem;
    font: inherit;
    letter-spacing: 0.5px;
    width: 100%;
    height: 2rem;
    background-color: $vs-code-gray1;
    color: $gray5;
    outline: none;
    z-index: 10;

    &:focus {
      outline: none;
    }
  }

  &__suggestions {
    position: absolute;
    top: 2rem;
    left: -1px;
    right: -1px;
    margin-top: -6px;
    z-index: 5;
    max-height: 50vh;
    overflow: auto;
    border: 1px solid $base15;
    border-radius: 0 0 $border-radius $border-radius;
    padding-top: 6px;
    background: $base15;

    &-block {
      margin: 1rem;

      &-title {
        margin: 0 0 0.3rem;
        text-transform: uppercase;
        border-bottom: 1px solid $base03;
      }
    }

    &-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    &-item {
      border-radius: $border-radius;
      padding: 0.3rem;
      cursor: pointer;

      &:hover,
      &:active {
        background: darken($base15, 5);
      }
    }
  }

  &__results {
    margin-top: 1rem;
    display: flex;
    align-items: flex-start;

    &-list {
      flex: 1;
      margin: -0.5rem 0 0 -0.5rem;
      display: flex;
      flex-wrap: wrap;
      padding: 0;
      list-style: none;
    }

    &-item {
      margin: 0.5rem 0 0 0.5rem;
      border-radius: $border-radius;
      display: inline-flex;
      align-items: center;
      padding: 0.3rem 0.5rem;
      background: $gray4;
      font-size: 0.9rem;
      color: $gray6;

      &-btn {
        margin-left: 0.3rem;
        border: none;
        border-radius: $border-radius;
        padding: 0.3rem;
        background: transparent;
        color: inherit;
        font: inherit;
        line-height: 0.5;
        outline: none;
        appearance: none;
        cursor: pointer;

        &:hover,
        &:active {
          background: $gray3;
        }
      }
    }

    &-clear-all {
      margin-left: 2rem;
      border: 1px solid transparent;
      border-radius: $border-radius;
      padding: 0.3rem 0.5rem;
      background: transparent;
      color: $gray4;
      appearance: none;
      outline: none;
      cursor: pointer;

      &:hover,
      &:active {
        border-color: $gray4;
      }
    }
  }
}
</style>
