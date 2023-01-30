<template>
  <div class="label">
    <span class="name">{{ actionSpec.nodeResult }}</span>
  </div>
</template>

<script lang="ts">
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
};
</script>

<style scoped lang="scss">
// See also: CallLabel .label
.label {
  display: inline-block;
  font-size: 9pt;
  margin-left: 1em;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-style: italic;
}
</style>
