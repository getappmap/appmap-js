<template>
  <div class="v-details-panel-labels" v-if="items && items.length > 0">
    <h5>Labels</h5>
    <ul class="labels">
      <li class="labels__item" v-for="(item, index) in items" :key="index">
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<script>
// import { SELECT_OBJECT } from '@/store/vsCode';

export default {
  name: 'v-details-panel-labels',
  props: {
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
      return item;
      /*
      if (this.$store) {
        this.$store.commit(SELECT_OBJECT, item.object);
      }
      */
    },
  },
};
</script>

<style scoped lang="scss">
.v-details-panel-labels {
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

  .labels {
    list-style-type: none;
    padding: 0;
    margin: 0 2rem 1.5rem;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;

    &__item {
      margin: 0 0.25rem 0.25rem 0;
      border-radius: 0.25rem;
      padding: 0.1rem 0.3rem;
      background: $base09;
      color: $base19;
      cursor: pointer;

      &:hover,
      &:active {
        background: $base11;
      }
    }
  }
}
</style>
