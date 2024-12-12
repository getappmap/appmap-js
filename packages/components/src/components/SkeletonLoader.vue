<template>
  <div class="skeleton-loader" />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'v-skeleton-loader',
});
</script>

<style lang="scss" scoped>
@keyframes skeleton {
  0% {
    background-position: -100% 0%;
  }
  100% {
    background-position: 100% 0%;
  }
}
.skeleton-loader {
  $alpha: 0.075;
  width: 100%;
  height: 100%;
  background-color: rgba(black, 0.1);
  background: linear-gradient(
    90deg,
    rgba(black, $alpha) 0%,
    rgba(white, $alpha) 50%,
    rgba(black, $alpha) 100%
  );
  background-size: 200% 100%;
  animation: skeleton 3s linear infinite;
}
</style>
