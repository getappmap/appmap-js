<template>
  <div class="label" style="display: contents">
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
.label {
  font-size: 9pt;
}
</style>
