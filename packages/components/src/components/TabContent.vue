<template>
  <div class="tab-content">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'v-tab-content',
};
</script>

<style scoped lang="scss">
.tab-content {
  height: inherit;
}
</style>
