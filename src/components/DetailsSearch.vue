<template>
  <div class="details-search">
    <form class="details-search__form">
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
          @click="selectObject(type, item)"
        >
          {{
            type !== 'sql' && item.prettyName
              ? item.prettyName
              : item.name || item
          }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import SearchIcon from '@/assets/search.svg';
import { CodeObject, AppMap } from '@/lib/models';
import { CodeObjectType } from '@/lib/models/codeObject';
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
        http: {
          title: 'HTTP routes',
          data: [],
        },
        labels: {
          title: 'Labels',
          data: [],
        },
        code: {
          title: 'Code',
          data: [],
        },
        sql: {
          title: 'SQL',
          data: [],
        },
      };

      this.appMap.classMap.codeObjects.forEach((codeObject) => {
        if (!this.passesFilter(codeObject)) {
          return;
        }

        switch (codeObject.type) {
          case 'package':
            if (codeObject.children.length > 1) {
              items.code.data.push(codeObject);
            }
            break;
          case 'function':
            items.code.data.push(codeObject);
            break;
          case 'class':
            if (codeObject.functions.length) {
              items.code.data.push(codeObject);
            }
            break;
          case 'route':
            items.http.data.push(codeObject);
            break;
          case 'query':
            codeObject.events.forEach((e) => items.sql.data.push(e));
            break;
          default:
            break;
        }
      });

      items.labels.data = Object.keys(this.appMap.labels).filter((l) =>
        this.passesFilter(l)
      );

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

      if (typeof obj !== 'string') {
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
      padding: 0.3rem 1rem;
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
        color: $base19;

        &::before {
          background: linear-gradient(
            to right,
            #bbbbbb 0%,
            #999999 50%,
            #696262 100%
          );
        }
      }

      .details-search__block--code &::before {
        background: linear-gradient(
          to right,
          #4362b1 0%,
          #2a4b9f 50%,
          #182d63 100%
        );
      }

      .details-search__block--sql &::before {
        background: linear-gradient(
          to right,
          #9c2fba 0%,
          #702286 50%,
          #521b61 100%
        );
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
    }
  }
}
</style>
