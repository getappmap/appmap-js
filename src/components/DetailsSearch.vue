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
      objects: {
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
      },
    };
  },

  computed: {
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

  watch: {
    '$store.state.appMap': {
      handler(appMap) {
        this.initObjects(appMap);
      },
    },
  },

  created() {
    this.initObjects = (appMap) => {
      appMap.classMap.codeObjects.forEach((codeObject) => {
        switch (codeObject.type) {
          case 'package':
          case 'class':
          case 'function':
            this.objects.code.data.push(codeObject);
            break;
          case 'route':
            this.objects.http.data.push(codeObject);
            break;
          case 'query':
            codeObject.events.forEach((e) => this.objects.sql.data.push(e));
            break;
          default:
            break;
        }
      });
      this.objects.labels.data = Object.keys(appMap.labels);
    };
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
      border-radius: $border-radius;
      padding: 0.3rem 1rem;
      color: $base03;
      cursor: pointer;

      .details-search__block--http & {
        background: linear-gradient(90deg, #c61c38 0%, #a62036 100%);

        &:hover {
          background: linear-gradient(90deg, #a62036 0%, #6b1a27 100%);
        }
      }

      .details-search__block--labels & {
        color: $base19;
        background: linear-gradient(90deg, #bbbbbb 0%, #999999 100%);

        &:hover {
          background: linear-gradient(90deg, #999999 0%, #696262 100%);
        }
      }

      .details-search__block--code & {
        background: linear-gradient(90deg, #4362b1 0%, #2a4b9f 100%);

        &:hover {
          background: linear-gradient(90deg, #2a4b9f 0%, #182d63 100%);
        }
      }

      .details-search__block--sql & {
        background: linear-gradient(90deg, #9c2fba 0%, #702286 100%);

        &:hover {
          background: linear-gradient(90deg, #702286 0%, #521b61 100%);
        }
      }

      &:not(:last-child) {
        margin-bottom: 0.5rem;
      }
    }
  }
}
</style>
