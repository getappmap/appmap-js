<template>
  <ul class="trace-node__labels">
    <li
      class="trace-node__label"
      v-for="label in labels"
      :key="label"
      @click.stop="$emit('selectLabel', label)"
    >
      {{ label }}
    </li>
  </ul>
</template>

<script>
export default {
  name: 'v-trace-node-labels',
  emits: ['selectLabel'],
  props: {
    labels: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
.trace-node__labels {
  list-style-type: none;
  margin: 0.5rem 0 -0.25rem -0.25rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
}

.trace-node__label {
  margin: 0 0 0.25rem 0.25rem;
  border-radius: 0.25rem;
  padding: 0.1rem 0.3rem;
  background: $base11;
  color: $base01;
  cursor: pointer;

  &:hover,
  &:active {
    background: $base11;
  }
}
</style>
