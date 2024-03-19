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
  lazyPanToElement,
  getElementCenter,
  getParentRelativeOffset,
  nodeFullyVisible,
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
    translateTo(x, y) {
      this.container.translateTo(x, y);
    },
    panToElement(element, parent = null) {
      const parentContainer = parent ?? this.container.element;

      if (nodeFullyVisible(this.container.element, element)) {
        return;
      }

      const coords = getParentRelativeOffset(element, parentContainer);
      const parentRect = this.container.element.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      this.container.translateTo(
        coords.left - parentRect.x + elementRect.width * 0.5,
        coords.top - parentRect.y + elementRect.height * 0.5
      );
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
  max-width: 100%;
  outline: none;
}
</style>

<style lang="scss">
.appmap__zoom {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;

  &-button {
    border: none;
    border-radius: 0.5rem;
    padding: 0.25rem 0.5rem;
    appearance: none;
    background: lighten($gray2, 10%);
    color: $gray5;
    font-weight: bold;
    cursor: pointer;
    opacity: 0.9;

    &:hover {
      opacity: 1;
    }
  }

  &-bar {
    margin: 3px 6px;
    position: relative;
    width: 20px;
    height: 90px;
    cursor: pointer;

    &::before {
      content: '';
      position: absolute;
      top: -3px;
      left: 50%;
      bottom: -3px;
      margin-left: -3px;
      width: 6px;
      background: lighten($gray2, 10%);
      opacity: 0.9;
    }
  }

  &-grab {
    position: absolute;
    border-radius: 3px;
    left: 0;
    width: 100%;
    height: 6px;
    background: $gray5;
    cursor: grab;
  }
}
</style>
