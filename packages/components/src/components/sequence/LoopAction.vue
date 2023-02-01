<template>
  <div
    class="loop"
    :style="{
      'grid-column': gridColumns,
      'grid-row': gridRows,
    }"
  >
    <div class="label">Loop</div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { ActionSpec } from './ActionSpec';

export default {
  name: 'v-sequence-loop',

  components: {},

  props: {
    actionSpec: {
      type: ActionSpec,
      required: true,
      readonly: true,
    },
  },
  data() {
    return {
      columnIndexSpan: this.actionSpec.descendantsActorIndexSpan,
    };
  },
  computed: {
    gridRows(): string {
      return [this.actionSpec.index + 2, this.actionSpec.returnIndex! + 2].join(' / ');
    },
    gridColumns(): string {
      const [min, max] = this.columnIndexSpan;
      return [min + 2, max + 2].join(' / ');
    },
  },
};
</script>

<style scoped lang="scss">
.loop {
  margin: 15px -20px 10px -20px;
  border: 1px solid magenta;
  position: relative;

  .label {
    padding: 5px;
    background: magenta;
    width: fit-content;
  }
}
</style>
