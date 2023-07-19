<template>
  <div class="label">
    <span class="name">{{ label }}</span>
  </div>
</template>

<script>
import { ActionSpec } from './ActionSpec';

export default {
  name: 'v-sequence-return-label',

  components: {},

  props: {
    actionSpec: {
      type: ActionSpec,
      required: true,
      readonly: true,
    },
  },

  computed: {
    label() {
      const { nodeResult } = this.actionSpec;
      return !nodeResult || nodeResult === 'void' ? '' : nodeResult;
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
</style>
