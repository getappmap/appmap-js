<template>
  <div class="v-details-panel-list" v-if="items && items.length > 0">
    <h5>{{ title }}</h5>
    <ul>
      <li v-for="(item, index) in items" :key="index" class="list-pair">
        <span class="list-pair__object" @click.prevent="selectItem(item.from)">
          {{ nameOf(item.from) }}
        </span>
        to
        <span class="list-pair__object" @click.prevent="selectItem(item.to)">
          {{ nameOf(item.to) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
import { SELECT_OBJECT } from '@/store/vsCode';

export default {
  name: 'v-details-panel-list-pairs',
  props: {
    title: String,
    items: {
      type: Array,
      default: () => [],
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
        this.$store.commit(SELECT_OBJECT, item);
      }
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

      &.list-pair {
        width: 100%;
        padding: 0.5rem 2rem;
        text-align: left;
        font-size: 1rem;

        &:hover {
          background-color: transparent;
          border-color: $gray3;
        }

        .list-pair__object {
          color: $blue;
          cursor: pointer;

          &:hover,
          &:active {
            color: $lightblue;
          }
        }
      }
    }
  }
}
</style>
