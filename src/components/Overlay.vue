<template>
  <div class="overlay">
    <div class="overlay" :style="styles">
      {{ text }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'v-overlay',
  props: {
    color: {
      type: String,
      default: '#000',
    },
    textColor: {
      type: String,
      default: '#fff',
    },
    opacity: {
      type: Number,
      default: 1.0,
    },
    text: String,
  },
  computed: {
    styles() {
      return {
        'background-color': this.color,
        color: this.textColor,
        opacity: this.opacity,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.overlay {
  pointer-events: none;
  position: absolute;
  z-index: 2147483647;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>
