<template>
  <div class="columns">
    <div class="columns__column columns__column--left">
      <slot name="left" />
    </div>
    <div class="columns__column columns__column--right">
      <slot name="right" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'v-trace-node-columns',
};
</script>

<style scoped lang="scss">
.columns {
  display: flex;
  flex-direction: row;
  width: 100%;

  &__column {
    flex: 1 0 auto;

    &--left {
      text-align: left;
      margin-right: 1em;
    }

    &--right {
      text-align: right;
      margin-left: 1em;
    }
  }
}
</style>
