<template>
  <div class="search-panel">
    <h3 class="search-panel__title">
      <div id="filter-input">
        <input type="text" size="80" placeholder="Filter the diagram by package, class or function" autocomplete="off"></input>
      </div>
    <div class="search-panel__content">
    </div>
  </div>
</template>

<script>
export default {
  name: 'v-search-panel',
  props: {
    subtitle: String,
    selectedObject: {
      type: Object,
    },
  },
};
</script>

<style scoped lang="scss">
.search-panel {
  background-color: var(--web-services);
}
</style>
