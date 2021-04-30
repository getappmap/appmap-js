<template>
  <div class="container" tabindex="0">
    <div ref="containerContent" style="transform: translate(0px, 0px)">
      <slot />
    </div>
  </div>
</template>

<script>
import {
  Container,
  panToNode,
  lazyPanToElement,
  getElementCenter,
} from '@appland/diagrams';

export default {
  name: 'v-container',
  props: {
    zoomControls: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      container: null,
    };
  },
  methods: {
    panToElement(element) {
      panToNode(this.container, element);
    },
    lazyPanToElement(element) {
      lazyPanToElement(this.container, element, 10);
    },
    centerContents() {
      this.container.centerX(10);
    },
    clearTransform() {
      this.container.translateTo(0, 0);
    },
    setScaleTarget(element) {
      this.container.scaleTarget = getElementCenter(element);
    },
    clearScaleTarget() {
      this.container.scaleTarget = false;
    },
  },
  mounted() {
    this.container = new Container(
      null,
      {
        pan: { momentum: true, boundary: { overlap: 0 } },
        zoom: { controls: this.zoomControls },
      },
      this.$el,
      this.$refs.containerContent
    );
    this.centerContents();
  },
};
</script>

<style scoped lang="scss">
.container {
  overflow: hidden;
  height: 100%;
  width: 100%;
  outline: none;
}
</style>
