<template>
  <div class="label" @mouseover="startHover" @mouseout="stopHover">
    <span class="name">{{ label }}</span>
    <span v-if="hover && returnValue" class="tooltip">{{ returnValue }}</span>
  </div>
</template>

<script>
import { ActionSpec } from './ActionSpec';

export default {
  name: 'v-sequence-return-label',

  data() {
    return {
      hover: false,
    };
  },

  methods: {
    startHover() {
      this.hover = true;
    },
    stopHover() {
      this.hover = false;
    },
  },

  props: {
    actionSpec: {
      type: ActionSpec,
      required: true,
      readonly: true,
    },
    returnValue: {
      type: String,
      required: true,
      readonly: true,
    },
  },

  computed: {
    label() {
      function extractSimpleName(fullName) {
        const segments = fullName.split('.');
        return segments[segments.length - 1];
      }

      const { nodeResult } = this.actionSpec;
      return !nodeResult || nodeResult === 'void' ? '' : extractSimpleName(nodeResult);
    },
  },
};
</script>

<style scoped lang="scss">
// See also: CallLabel .label
.label {
  display: inline-block;
  font-size: 9pt;
  font-family: 'IBM Plex Mono', monospace;
  margin-left: 1em;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-style: italic;
  color: lighten($gray4, 20);
}

.tooltip {
  position: absolute;
  background-color: #fff;
  color: #000;
  border: 1px solid #ccc;
  padding: 5px;
  z-index: 1;
  opacity: 0.9;
}
</style>
