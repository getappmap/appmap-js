<template>
  <div class="modal" @scroll.prevent>
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
  methods: {
    handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        this.$emit('close');
      } else if (e.key === 'Enter' && e.ctrlKey) {
        this.$emit('submit');
      }
    },
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  destroyed() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
});
</script>

<style lang="scss" scoped>
.modal {
  &__bg {
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(0.25rem);
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1000;
  }

  &__content {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1001;
    width: 100%;
    height: 100%;
    pointer-events: none;

    & > * {
      pointer-events: auto;
    }
  }
}
</style>
