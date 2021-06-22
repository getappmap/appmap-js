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
          placeholder="Search..."
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
import SearchIcon from '@/assets/search.svg';
import { CodeObject, AppMap, CodeObjectType } from '@appland/models';
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
            const { type: parentType } = codeObject.parent;
            items[parentType].data.push(item);
            break;

          default:
            break;
        }
      });

      Object.entries(this.appMap.labels).forEach(([label, labelData]) => {
        if (this.passesFilter(label)) {
          items.labels.data.push({
            object: label,
            childrenCount: labelData.function.length + labelData.event.length,
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

      return new RegExp(filterString, 'ig');
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
      const { filterRegex } = this;
      if (!filterRegex) {
        // If it's null, we don't need to apply any filtering. Always return true.
        return true;
      }

      let filterString = obj;

      if (obj instanceof CodeObject) {
        filterString =
          obj.type === CodeObjectType.QUERY ? obj.name : obj.prettyName;
      }

      if (typeof filterString !== 'string') {
        return false;
      }

      return !this.filterRegex || this.filterRegex.test(filterString);
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
    padding: 0 2rem;
  }

  &__input-wrap {
    position: relative;
    border-radius: $border-radius;
    padding: 2px;
    background: linear-gradient(to right, #4562b1 0%, #540a9f 100%);

    .details-search--empty & {
      background: $gray3;
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
      fill: currentColor;
    }
  }

  &__input-element {
    border: none;
    border-radius: $border-radius;
    width: 100%;
    padding: 0.5rem 2rem;
    font: inherit;
    font-size: 0.9rem;
    color: $base06;
    background: $vs-code-gray1;
    outline: none;

    &::-webkit-placeholder,
    &::-moz-placeholder,
    &::placeholder {
      color: $base06;
    }
  }

  &__block {
    margin-bottom: 1rem;

    &-title {
      margin: 0;
      border-bottom: 1px solid $base15;
      padding: 0 2rem 0.2rem;
      color: $base12;
      font-size: 0.8rem;
      font-weight: bold;
      text-transform: uppercase;
    }

    &-list {
      margin: 0;
      padding: 0.5rem 2rem;
      list-style: none;
    }

    &-item {
      position: relative;
      border-radius: $border-radius;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.3rem 1rem;
      min-height: 2rem;
      color: $base03;
      cursor: pointer;
      overflow: hidden;
      z-index: 0;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 200%;
        height: 100%;
        transition: transform 0.3s ease-in-out;
        z-index: -1;
      }

      &:hover::before {
        transform: translateX(-50%);
      }

      .details-search__block--http &::before {
        background: linear-gradient(
          to right,
          #c61c38 0%,
          #a62036 50%,
          #6b1a27 100%
        );
      }

      .details-search__block--labels & {
        display: inline-flex;
        color: $base19;

        &:not(:last-child) {
          margin-right: 0.5rem;
        }

        &::before {
          background: linear-gradient(
            to right,
            #bbbbbb 0%,
            #999999 50%,
            #696262 100%
          );
        }
      }

      .details-search__block--package & {
        color: $base19;

        &::before {
          background: linear-gradient(
            to right,
            #6fddd6 0%,
            #23a69e 50%,
            #0e958d 100%
          );
        }
      }

      .details-search__block--class &::before,
      .details-search__block--function &::before {
        background: linear-gradient(
          to right,
          #4362b1 0%,
          #2a4b9f 50%,
          #182d63 100%
        );
      }

      .details-search__block--query &::before {
        background: linear-gradient(
          to right,
          #9c2fba 0%,
          #702286 50%,
          #521b61 100%
        );
      }

      .details-search__block--external-service & {
        color: $base19;

        &::before {
          background: linear-gradient(
            to right,
            $yellow,
            darken($yellow, 20) 100%
          );
        }
      }

      .details-search__block--empty & {
        pointer-events: none;

        &::before {
          background: $gray3;
        }
      }

      &:not(:last-child) {
        margin-bottom: 0.5rem;
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
    }
  }
}
</style>
