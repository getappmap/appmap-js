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
  list-style-type: none;
  padding: 0;
  margin-bottom: 1.5rem;

  h5 {
    color: $gray4;
    font-size: 0.9rem;
    font-weight: 800;
    line-height: 1.2;
    padding: 0;
    margin: 0 0 1rem 0;
    text-transform: uppercase;
  }

  .labels {
    list-style-type: none;
    padding: 0 0.5rem;
    margin: 0 0 1rem;
    font-size: 0.9em;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;

    &__item {
      margin: 0 0.25rem 0.25rem 0;
      border-radius: 0.25rem;
      padding: 0.25rem;
      color: $base03;
      border: 1px solid $base15;
      cursor: pointer;
      transition: 0.25s ease-out all;

      &:hover,
      &:active {
        background: $base03;
        color: $base15;
        border-color: $base03;
      }
    }
  }
}
</style>
