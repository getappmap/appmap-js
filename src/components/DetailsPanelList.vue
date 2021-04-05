<template>
  <div class="v-details-panel-list" v-if="items && items.length > 0">
    <h5>{{ title }}</h5>
    <ul>
      <li v-for="(item, index) in filteredItems" :key="index">
        <button class="list-item" @click.prevent="selectItem(item)">
          {{ nameOf(item.object) }}
          <span class="list-item__count" v-if="uniqueItems && item.count > 1">
            {{ item.count }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { SELECT_OBJECT } from '@/store/vsCode';

export default {
  name: 'v-details-panel-list',
  props: {
    title: String,
    items: {
      type: Array,
      default: () => [],
    },
    uniqueItems: {
      type: Boolean,
      default: true,
    },
    nameKey: {
      type: String,
    },
  },
  methods: {
    nameOf(item) {
      if (this.nameKey) {
        return item[this.nameKey];
      }

      return item.prettyName || item.name || item.toString();
    },
    selectItem(item) {
      if (this.$store) {
        this.$store.commit(SELECT_OBJECT, item.object);
      }
    },
  },
  computed: {
    filteredItems() {
      if (!this.uniqueItems) {
        return this.items.map((item) => ({ object: item }));
      }

      return Object.values(
        this.items.reduce((memo, item) => {
          const { id } = item;
          let memoElement = memo[id];
          if (!memoElement) {
            memoElement = { object: item, count: 0 };
            memo[id] = memoElement; // eslint-disable-line no-param-reassign
          }
          memoElement.count += 1;
          return memo;
        }, {})
      );
    },
  },
};
</script>

<style scoped lang="scss">
.v-details-panel-list {
  list-style-type: none;
  padding: 0;
  margin-bottom: 1.5rem;

  h5 {
    color: $base03;
    font-size: 1.1rem;
    font-weight: 500;
    line-height: 1.2;
    padding: 0 2rem;
    margin: 0 0 1rem 0;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin-bottom: 1.5rem;
    margin-top: 0;

    li {
      border-bottom: 1px solid $gray3;
      transition: $transition;

      &:hover {
        background-color: $blue;
        border-color: $blue;
        button {
          color: $white;
        }
      }

      &:first-of-type {
        border-top: 1px solid $gray3;
      }

      .list-item {
        display: inline-flex;
        width: 100%;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 2rem;
        color: $blue;
        text-decoration: none;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        font-size: 1rem;

        &:focus {
          outline: 0;
        }

        &__count {
          margin-left: 1rem;
          border-radius: 0.5rem;
          display: inline-block;
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          line-height: 1;
          color: white;
          background-color: $gray4;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
