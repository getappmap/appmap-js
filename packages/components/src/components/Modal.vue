<template>
  <div class="modal">
    <div class="modal__bg" @click="$emit('close')" />
    <div class="modal__content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'v-modal',
});
</script>

<style lang="scss" scoped>
.modal {
  &__bg {
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(0.25rem);
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
  }

  &__content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    padding: 1rem;
    border-radius: 4px;
  }
}
</style>
