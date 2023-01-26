<template>
  <div class="label">
    <span class="name">{{ actionSpec.nodeName }}</span>
    <template v-if="actionSpec.hasElapsed">
      <span class="elapsed">{{ actionSpec.elapsedTimeMs }} ms</span>
    </template>
  </div>
</template>

<script lang="ts">
import { ActionSpec } from './ActionSpec';

export default {
  name: 'v-sequence-call-label',

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
// See also: ReturnLabel .label
.label {
  display: inline-block;
  font-size: 9pt;
  margin-left: 1em;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.elapsed {
  color: lightgray;
}
</style>
