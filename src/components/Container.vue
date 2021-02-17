<template>
  <div class="container">
    <div ref="containerContent" style="transform: translate(0px, 0px)">
      <slot />
    </div>
  </div>
</template>

<script>
import Container from '@/lib/diagrams/helpers/container';
import { panToNode, lazyPanToElement } from '@/lib/diagrams/util';

export default {
  name: 'v-container',
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
      this.container.centerContents();
    },
  },
  mounted() {
    this.container = new Container(
      null,
      {
        pan: { momentum: true },
        zoom: { controls: true },
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
}
</style>
