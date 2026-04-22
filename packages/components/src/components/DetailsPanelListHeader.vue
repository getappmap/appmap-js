<template>
  <h5 class="details-panel-list-header"><slot /></h5>
</template>

<script>
export default { name: 'v-details-panel-list-header' };
</script>

<style lang="scss">
h5.details-panel-list-header {
  border-bottom: 1px solid $gray2;
  color: $gray4;
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.4;
  margin: 0 0 8px 0;
  padding-bottom: 8px;
  text-transform: uppercase;
}
</style>
