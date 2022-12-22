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
          <span v-if="item.childrenCount > 1" class="details-search__block-item-count">
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
import { SELECT_OBJECT, SELECT_LABEL, SET_VIEW, VIEW_FLOW } from '../store/vsCode';

export default {
  name: 'v-details-search',

  components: {
    SearchIcon,
  },

  props: {
    appMap: AppMap,
    findings: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      filter: '',
    };
  },

  computed: {
    listItems() {
      const items = {
        [CodeObjectType.ANALYSIS_FINDING]: {
          title: 'Analysis Findings',
          data: [],
        },
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
              labelData.function.length + (labelData.event ? labelData.event.length : 0),
          });
        }
      });

      const eventsById = this.appMap.data.events.reduce((map, e) => {
        map[e.id] = e.callEvent;
        return map;
      }, {});

      this.findings.forEach(({ finding, appMapUri: { fragment } }) => {
        const { traceFilter } = fragment;

        const events = fragment.traceFilter.split(' ').map((idStr) => {
          const id = Number(idStr.split(':')[1]);
          return eventsById[id];
        });

        items['analysis-finding'].data.push({
          object: {
            name: `${finding.impactDomain}:${finding.ruleTitle}`,
            events,
            traceFilter,
          },
          childrenCount: 1,
        });
      });

      Object.entries(items).forEach(([key, item]) => {
        if (!item.data.length) {
          delete items[key];
          return;
        }
        item.data = item.data.sort((a, b) => {
          const aStr = a.object instanceof CodeObject ? a.object.prettyName : String(a.object);
          const bStr = b.object instanceof CodeObject ? b.object.prettyName : String(b.object);
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
      } else if (type === 'analysis-finding') {
        const { events } = object;
        if (events && events.length >= 1) {
          this.$store.commit(SELECT_OBJECT, events);
          this.$store.commit(SET_VIEW, VIEW_FLOW);
          this.$emit('onChangeFilter', `${object.traceFilter} `);
        }
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
        const filterString = obj.type === CodeObjectType.QUERY ? obj.name : obj.prettyName;
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

<style scoped lang="scss">
.analysis-finding {
  h3 {
    font-size: 0.9rem;
    margin: 0.5rem 0 0 0;
  }
}
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
    display: flex;
    align-content: center;
    gap: 1rem;
    padding: 0.3rem;

    .details-search--empty & {
      border-radius: $gray3;
      pointer-events: none;
    }
  }

  .analysis-finding {
    .findings-list {
      list-style-type: none;
      padding: 0;
      margin: 0;
      li {
        border-bottom: 1px solid $gray2;
        &:last-of-type {
          border-bottom: 0;
        }
        .analysis li {
          border-bottom: 0;
        }
      }
    }
  }

  &__input-prefix {
    color: $base06;
    display: flex;
    align-items: center;

    svg {
      position: relative;
      left: 3px;
      fill: $lightgray2;
    }
  }

  &__input-element {
    border: none;
    width: 100%;
    font: inherit;
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

  &__block {
    padding: 1.5rem 0.5rem;
    border-bottom: 2px solid $gray2;

    &-title {
      margin: 0 0 0.25rem;
      border-radius: 4px;
      display: inline-block;
      padding: 0.25rem 0;
      color: $base01;
      font-size: 0.9rem;
      font-weight: bold;
      text-transform: uppercase;

      .details-search__block--http & {
        color: #8e45aa;
      }

      .details-search__block--external-service & {
        color: $yellow;
      }

      .details-search__block--labels & {
        color: $base11;
      }

      .details-search__block--package & {
        color: $teal;
      }

      .details-search__block--class &,
      .details-search__block--function & {
        color: $blue;
      }

      .details-search__block--query & {
        color: $royal;
      }

      .details-search__block--empty & {
        color: $gray3;
      }
      .details-search__block--analysis-finding & {
        color: $hotpink;
      }
    }

    &-list {
      margin: 0;
      padding: 0 0.5rem;
      list-style: none;
      li {
        &:last-of-type {
          border-bottom: 0;
        }
      }

      .details-search__block--labels & {
        margin: 0 -0.25rem -0.25rem;
      }
      &.analysis {
        padding: 0 0 1rem 0;
        li {
          border-bottom: 0;
          padding: 0.2rem 0;
          min-height: unset;
          justify-content: flex-start;
          gap: 0.5rem;
          span {
            color: $gray4;
          }
          svg {
            margin-right: 0.25rem;
          }
        }
      }
    }

    &-item {
      position: relative;
      border-bottom: 1px solid $gray2;
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
        border: 1px solid $base15 !important;
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
