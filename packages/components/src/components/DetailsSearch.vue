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
          placeholder="Search for code objects"
          ref="searchInput"
          v-model="filter"
        />
      </div>
    </form>
    <v-list
      v-for="type in Object.keys(listItems)"
      :key="type"
      :title="listItems[type].title"
      :type="type"
      :itemsType="type === 'labels' ? 'cloud' : 'default'"
    >
      <v-list-item
        v-for="(item, index) in listItems[type].data"
        :key="index"
        @click.native="selectObject(type, item.object)"
      >
        {{
          type !== 'query' && item.object.prettyName
            ? item.object.prettyName
            : item.object.name || item.object
        }}
        <span
          v-if="item.childrenCount > 1"
          class="details-search__list-item-count"
        >
          {{ item.childrenCount }}
        </span>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import { CodeObject, AppMap, CodeObjectType } from '@appland/models';
import VList from '@/components/common/List.vue';
import VListItem from '@/components/common/ListItem.vue';
import SearchIcon from '@/assets/search.svg';
import { SELECT_OBJECT, SELECT_LABEL } from '../store/vsCode';

export default {
  name: 'v-details-search',

  components: {
    VList,
    VListItem,
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
      if (typeof obj === 'string') {
        return this.filterRegex.test(obj);
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
    margin-bottom: 1rem;
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
      color: $lightgray2;
    }
  }

  &__list-item-count {
    margin-left: 0.5rem;
    border-radius: $border-radius;
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    line-height: 1;
    color: currentColor;
    background-color: rgba(0, 0, 0, 0.2);
    white-space: nowrap;
  }
}
</style>
