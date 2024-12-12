<template>
  <div class="loader">
    <div class="dot" />
    <div class="dot" :style="{ 'animation-delay': '-0.15s' }" />
    <div class="dot" :style="{ 'animation-delay': '-0.3s' }" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'v-loader',
});
</script>

<style lang="scss" scoped>
@keyframes loading {
  0%,
  100% {
    transform: translateY(100%) scaleX(1.2);
  }
  50% {
    transform: translateY(-100%) scaleY(1.1);
  }
}

.loader {
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  gap: 12%;

  .dot {
    aspect-ratio: 1 / 1;
    width: 33%;
    border-radius: 2em;
    background-color: $color-foreground;
    animation: 1s infinite loading ease-in-out;
  }
}
</style>
