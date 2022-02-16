<template>
  <div class="v-details-panel-labels" v-if="items && items.length > 0">
    <h5>Labels</h5>
    <ul class="labels">
      <li
        class="labels__item"
        v-for="(item, index) in items"
        :key="index"
        @click.stop="selectLabel(item)"
      >
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<script>
import { SELECT_LABEL } from '../store/vsCode';

export default {
  name: 'v-details-panel-labels',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    selectLabel(label) {
      this.$store.commit(SELECT_LABEL, label);
    },
  },
};
</script>

<style scoped lang="scss">
.v-details-panel-labels {
  margin-bottom: 1rem;
  border-radius: $border-radius;
  padding: 0.5rem;
  color: $base03;
  background-color: rgba(0, 0, 0, 0.1);

  h5 {
    margin: 0 0 0.5rem;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    color: $base03;
    background-color: $base11;
  }

  .labels {
    list-style-type: none;
    padding: 0;
    margin: 0 0 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.5rem;

    &__item {
      border: 1px solid $base15;
      border-radius: $border-radius;
      font-size: 0.75rem;
      padding: 0.5rem;
      color: $base03;
      cursor: pointer;

      &:hover,
      &:active {
        color: $base06;
      }
    }
  }
}
</style>
