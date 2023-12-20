<template>
  <span class="badge">
    <slot />
  </span>
</template>

<script lang="ts">
//@ts-nocheck

export default {
  name: 'v-badge',
};
</script>

<style lang="scss" scoped>
.badge {
  background-color: $brightblue;
  color: $white;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.65rem;
  font-weight: 600;
  vertical-align: bottom;
  text-transform: uppercase;
}
</style>
