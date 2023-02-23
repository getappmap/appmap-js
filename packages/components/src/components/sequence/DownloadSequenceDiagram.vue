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
      [...node.querySelectorAll('.sequence-actor')].forEach(
        (element) => (element.style.position = 'absolute')
      );
      assert(node, '#sequence-diagram-ui not found');
      const svgDocument = elementToSVG(node);

      // Inline external resources (fonts, images, etc) as data: URIs
      await inlineResources(svgDocument.documentElement);

      // Get SVG string
      const svgString = new XMLSerializer().serializeToString(svgDocument);
      this.$root.$emit('exportSVG', svgString);
    },
  },
};
</script>

<style scoped lang="scss"></style>
