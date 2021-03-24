<template>
  <div :class="classes">
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
          :disabled="isEmptyAppMap"
        />
      </div>
    </form>
    <section
      :class="`details-search__block details-search__block--${type}`"
      v-for="type in Object.keys(filteredObjects)"
      :key="type"
    >
      <h2 class="details-search__block-title">
        {{ filteredObjects[type].title }}
      </h2>
      <ul class="details-search__block-list">
        <li
          class="details-search__block-item"
          v-for="(item, index) in filteredObjects[type].data"
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
    <section
      class="details-search__block details-search__block--empty"
      v-if="isEmptyAppMap"
    >
      <h2 class="details-search__block-title">Error</h2>
      <ul class="details-search__block-list">
        <li class="details-search__block-item">No data to display</li>
      </ul>
    </section>
  </div>
</template>

<script>
import SearchIcon from '@/assets/search.svg';
import { SELECT_OBJECT, SELECT_LABEL } from '../store/vsCode';

export default {
  name: 'v-details-search',

  components: {
    SearchIcon,
  },

  data() {
    return {
      filter: '',
    };
  },

  computed: {
    classes() {
      const result = ['details-search'];

      if (this.isEmptyAppMap) {
        result.push('details-search--empty');
      }

      return result;
    },
    isEmptyAppMap() {
      return (
        Object.keys(this.objects).filter((k) => !!this.objects[k].data.length)
          .length === 0
      );
    },
    objects() {
      const { appMap } = this.$store.state;
      const objects = {
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

      appMap.classMap.codeObjects.forEach((codeObject) => {
        switch (codeObject.type) {
          case 'package':
            if (codeObject.children.length > 1) {
              objects.code.data.push(codeObject);
            }
            break;
          case 'function':
            objects.code.data.push(codeObject);
            break;
          case 'class':
            if (codeObject.functions.length) {
              objects.code.data.push(codeObject);
            }
            break;
          case 'route':
            objects.http.data.push(codeObject);
            break;
          case 'query':
            codeObject.events.forEach((e) => objects.sql.data.push(e));
            break;
          default:
            break;
        }
      });
      objects.labels.data = Object.keys(appMap.labels);

      return objects;
    },
    filteredObjects() {
      const filter = this.filter.trim();
      const objects = {};

      Object.keys(this.objects).forEach((type) => {
        objects[type] = {
          title: this.objects[type].title,
          data: [],
        };

        const filteredList = this.objects[type].data.filter((item) => {
          const objectName =
            type !== 'sql' && item.prettyName
              ? item.prettyName
              : item.name || item;
          return new RegExp(filter, 'ig').test(objectName);
        });

        if (filteredList.length) {
          objects[type].data = filteredList;
        } else {
          delete objects[type];
        }
      });

      return objects;
    },
  },

  methods: {
    selectObject(type, object) {
      switch (type) {
        case 'http':
        case 'code':
        case 'sql':
          this.$store.commit(SELECT_OBJECT, object);
          break;
        case 'labels':
          this.$store.commit(SELECT_LABEL, object);
          break;
        default:
          break;
      }
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
