<template>
  <div class="details-search">
    <form class="details-search__form" @submit.prevent>
      <div class="details-search__input-wrap">
        <span class="details-search__input-prefix">
          <SearchIcon />
        </span>
        <input
          class="details-search__input-element"
          type="text"
          autocomplete="off"
          placeholder="search code objects..."
          ref="searchInput"
          v-model="filter"
        />
      </div>
    </form>
    <section
      :class="`details-search__block details-search__block--${type}`"
      v-for="type in Object.keys(listItems)"
      :key="type"
    >
      <h2 class="details-search__block-title">
        {{ listItems[type].title }}
      </h2>
      <ul class="details-search__block-list">
        <li
          class="details-search__block-item"
          v-for="(item, index) in listItems[type].data"
          :key="index"
          @click="selectObject(type, item.object)"
        >
          {{
            type !== 'query' && item.object.prettyName
              ? item.object.prettyName
              : item.object.name || item.object
          }}
          <span
            v-if="item.childrenCount > 1"
            class="details-search__block-item-count"
          >
            {{ item.childrenCount }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import { CodeObject, AppMap, CodeObjectType } from '@appland/models';
import SearchIcon from '@/assets/search.svg';
import { SELECT_OBJECT, SELECT_LABEL } from '../store/vsCode';

export default {
  name: 'v-details-search',

  components: {
    SearchIcon,
  },

  props: {
    appMap: AppMap,
  },

  data() {
    return {
      filter: '',
    };
  },

  computed: {
    listItems() {
      const items = {
        [CodeObjectType.HTTP]: {
          title: 'HTTP server requests',
          data: [],
        },
        [CodeObjectType.EXTERNAL_SERVICE]: {
          title: 'External services',
          data: [],
        },
        labels: {
          title: 'Labels',
          data: [],
        },
        [CodeObjectType.PACKAGE]: {
          title: 'Packages',
          data: [],
        },
        [CodeObjectType.CLASS]: {
          title: 'Classes',
          data: [],
        },
        [CodeObjectType.FUNCTION]: {
          title: 'Functions',
          data: [],
        },
        [CodeObjectType.QUERY]: {
          title: 'SQL queries',
          data: [],
        },
      };

      this.appMap.classMap.codeObjects.forEach((codeObject) => {
        if (!this.passesFilter(codeObject)) {
          return;
        }

        const item = {
          object: codeObject,
          childrenCount: codeObject.events ? codeObject.events.length : 0,
        };

        switch (codeObject.type) {
          case CodeObjectType.PACKAGE:
            if (codeObject.childLeafs().length > 1) {
              items[codeObject.type].data.push(item);
            }
            break;

          case CodeObjectType.CLASS:
            if (codeObject.functions.length) {
              items[codeObject.type].data.push(item);
            }
            break;

          case CodeObjectType.FUNCTION:
          case CodeObjectType.QUERY:
          case CodeObjectType.EXTERNAL_SERVICE:
            items[codeObject.type].data.push(item);
            break;

          case CodeObjectType.ROUTE:
            {
              const { type: parentType } = codeObject.parent;
              items[parentType].data.push(item);
            }
            break;

          default:
            break;
        }
      });

      Object.entries(this.appMap.labels).forEach(([label, labelData]) => {
        if (this.passesFilter(label)) {
          items.labels.data.push({
            object: label,
            childrenCount:
              labelData.function.length +
              (labelData.event ? labelData.event.length : 0),
          });
        }
      });

      Object.entries(items).forEach(([key, item]) => {
        if (!item.data.length) {
          delete items[key];
          return;
        }
        item.data = item.data.sort((a, b) => {
          const aStr =
            a.object instanceof CodeObject
              ? a.object.prettyName
              : String(a.object);
          const bStr =
            b.object instanceof CodeObject
              ? b.object.prettyName
              : String(b.object);
          return aStr.localeCompare(bStr);
        });
      });

      return items;
    },

    filterRegex() {
      const filterString = this.filter.trim();
      if (filterString === '') {
        return null;
      }

      return new RegExp(filterString, 'i');
    },
  },

  methods: {
    selectObject(type, object) {
      if (type === 'labels') {
        this.$store.commit(SELECT_LABEL, object);
      } else {
        this.$store.commit(SELECT_OBJECT, object);
      }
    },

    passesFilter(obj) {
      // If it's null, we don't need to apply any filtering. Always return true.
      if (!this.filterRegex) {
        return true;
      }

      if (obj instanceof CodeObject) {
        const filterString =
          obj.type === CodeObjectType.QUERY ? obj.name : obj.prettyName;
        return this.filterRegex.test(filterString);
      }

      return false;
    },
  },
};
</script>

<style lang="scss" scoped>
.details-search {
  margin-bottom: 2rem;
  padding: 0;

  &__form {
    margin-bottom: 1.5rem;
    padding: 0;
  }

  &__input-wrap {
    position: relative;
    border-radius: $border-radius;
    border: 2px solid $light-purple;

    .details-search--empty & {
      border-radius: $gray3;
      pointer-events: none;
    }
  }

  &__input-prefix {
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

  &__input-element {
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

  &__block {
    margin-bottom: 1rem;

    &-title {
      margin: 0 0 0.25rem;
      border-radius: 4px;
      display: inline-block;
      padding: 0.25rem 0.5rem;
      color: $base01;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;

      .details-search__block--http & {
        background-color: #542168;
      }

      .details-search__block--external-service & {
        background-color: $yellow;
        color: $base19;
      }

      .details-search__block--labels & {
        background-color: $base11;
      }

      .details-search__block--package & {
        background-color: $teal;
      }

      .details-search__block--class &,
      .details-search__block--function & {
        background-color: $blue;
      }

      .details-search__block--query & {
        background-color: $royal;
      }

      .details-search__block--empty & {
        background-color: $gray3;
      }
    }

    &-list {
      margin: 0;
      padding: 0;
      list-style: none;

      .details-search__block--labels & {
        margin: 0 -0.25rem -0.25rem;
      }
    }

    &-item {
      position: relative;
      border-bottom: 1px solid $base15;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
      min-height: 2rem;
      font-size: 0.9em;
      color: $base03;
      cursor: pointer;
      overflow: hidden;
      z-index: 0;

      &:hover,
      &:active {
        color: $base06;
      }

      &-count {
        margin-left: 1rem;
        border-radius: 0.5rem;
        display: inline-block;
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
        line-height: 1;
        color: currentColor;
        background-color: rgba(0, 0, 0, 0.2);
        white-space: nowrap;
      }

      .details-search__block--labels & {
        margin: 0.25rem;
        border: 1px solid $base15;
        border-radius: 4px;
        display: inline-flex;
        padding: 0.25rem 0.5rem;

        &-count {
          margin-left: 0.5rem;
        }
      }
    }
  }
}
</style>
