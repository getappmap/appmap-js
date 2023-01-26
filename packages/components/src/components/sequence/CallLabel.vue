<template>
  <div class="label" style="display: contents">
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
.label {
  font-size: 9pt;
}

.elapsed {
  color: lightgray;
}
</style>
