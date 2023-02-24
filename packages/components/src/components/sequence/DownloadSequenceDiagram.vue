<template>
  <div><slot /></div>
</template>

<script>
import assert from 'assert';
import { elementToSVG, inlineResources } from 'dom-to-svg';

export default {
  name: 'v-download-sequence-diagram',

  methods: {
    async download() {
      // Capture specific element
      const node = document.querySelector('#sequence-diagram-ui');
      assert(node, '#sequence-diagram-ui not found');

      this.cleanUpDOM(node);
      const svgDocument = elementToSVG(node);

      // Inline external resources (fonts, images, etc) as data: URIs
      await inlineResources(svgDocument.documentElement);

      // Get SVG string
      const svgString = new XMLSerializer().serializeToString(svgDocument);
      this.$root.$emit('exportSVG', svgString);
    },

    cleanUpDOM(node) {
      [...node.querySelectorAll('.sequence-actor')].forEach(
        (element) => (element.style.position = 'absolute')
      );

      [...node.querySelectorAll('.hide-container').forEach((element) => element.remove())];

      [...node.querySelectorAll('.collapse-expand').forEach((element) => element.remove())];
    },
  },
};
</script>

<style scoped lang="scss"></style>
