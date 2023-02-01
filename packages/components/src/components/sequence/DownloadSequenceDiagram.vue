<template>
  <button type="button" @click="download" class="download-button">Download</button>
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
      const svgDocument = elementToSVG(node);

      // Inline external resources (fonts, images, etc) as data: URIs
      await inlineResources(svgDocument.documentElement);

      // Get SVG string
      const svgString = new XMLSerializer().serializeToString(svgDocument);

      const url = window.URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml' }));
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'sequence-diagram.svg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
  },
};
</script>

<style scoped lang="scss"></style>
