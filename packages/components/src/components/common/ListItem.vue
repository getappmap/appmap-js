<template>
  <li class="list__item">
    <slot />
  </li>
</template>

<script>
export default {
  name: 'v-list-item',

  props: {
    item: Object,
  },
};
</script>

<style lang="scss" scoped>
.list__item {
  position: relative;
  border-bottom: 1px solid $base15;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  min-height: 2rem;
  font-size: 0.9em;
  color: $base03;
  cursor: pointer;
  overflow: hidden;

  &:hover,
  &:active {
    color: $base06;
  }
}
</style>
