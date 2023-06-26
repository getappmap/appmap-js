<!--
  This component is a re-implementation of:
  https://github.com/getappmap/appmap-js/blob/main/packages/diagrams/src/helpers/container/zoom.js
  The problem with reusing the original implementation is that it is tangled with functionalities
  like drag and drop panel, which we don't need here. Also it is not a vue component, so it is less
  consistent with the packages/components codebase. In the future this component could be reused to
  implement the zoom slider of the dependency diagram and trace diagram.
-->

<template>
  <div class="slider">
    <button class="button" @click="increase">&plus;</button>
    <div ref="handle" class="handle" @click="set">
      <div class="bar"></div>
      <div class="grab" @mousedown="startDragging" :style="grabStyle"></div>
    </div>
    <button class="button" @click="decrease">&minus;</button>
  </div>
</template>

<script>
const clamp = (val) => (val > 1 ? 1 : val < 0 ? 0 : val);
export default {
  name: 'v-slider',
  emits: ['slide'],
  props: {
    value: {
      type: Number,
      required: true,
    },
    stepButton: {
      type: Number,
      default: 0.1,
    },
    stepWheel: {
      type: Number,
      default: 0.0001,
    },
  },
  data() {
    return {
      dragging: false,
    };
  },
  computed: {
    grabStyle() {
      return {
        bottom: `${100 * clamp(this.value)}%`,
      };
    },
  },
  methods: {
    set(event) {
      const rect = this.$refs.handle.getBoundingClientRect();
      this.$emit('slide', clamp(1 - (event.clientY - rect.top) / rect.height));
    },
    increase() {
      this.$emit('slide', clamp(this.value + this.stepButton));
    },
    decrease() {
      this.$emit('slide', clamp(this.value - this.stepButton));
    },
    startDragging() {
      this.dragging = true;
    },
    drag(event) {
      if (this.dragging) {
        this.set(event);
      }
    },
    stopDragging() {
      this.dragging = false;
    },
  },
  mounted() {
    document.addEventListener('mousemove', this.drag);
    document.addEventListener('mouseup', this.stopDragging);
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', this.drag);
    document.removeEventListener('mouseup', this.stopDragging);
  },
};
</script>

<style scoped lang="css">
.slider {
  height: fit-content;
  width: fit-content;
}

.button {
  border: none;
  user-select: none;
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  appearance: none;
  background: #242c41;
  color: #808b98;
  font-weight: bold;
  cursor: pointer;
  opacity: 0.8;
}

.handle {
  width: 20px;
  height: 96px;
  margin: auto;
  position: relative;
  cursor: pointer;
}

.bar {
  width: 6px;
  height: 100%;
  margin: auto;
  background: #242c41;
  opacity: 0.8;
}

.grab {
  width: 100%;
  height: 6px;
  position: absolute;
  transform: translateY(3px);
  border-radius: 3px;
  background: #808b98;
  cursor: grab;
  z-index: 10;
}
</style>
