<template>
  <div
    class="diff-channel"
    :style="{
      'grid-column': [1, maxGridColumn + 1].join(' / '),
      'grid-row': gridRows,
    }"
  >
    <div class="diff-channel-marker">
      <div class="diff-channel-label">
        <span>{{ diffRowLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { DiffMode } from '@appland/sequence-diagram';
import { ActionSpec } from './ActionSpec';

export default {
  name: 'v-diff-channel',

  components: {},

  props: {
    actionSpec: {
      type: ActionSpec,
      required: true,
      readonly: true,
    },
  },

  computed: {
    gridRows(): string {
      return this.actionSpec.gridRows;
    },
    maxGridColumn(): number {
      return this.actionSpec.maxGridColumn;
    },
    diffRowLabel(): string {
      if (this.actionSpec.action.diffMode === DiffMode.Insert) return '+';
      else if (this.actionSpec.action.diffMode === DiffMode.Delete) return '-';
      else if (this.actionSpec.action.diffMode === DiffMode.Change) return '+/-';

      return '';
    },
  },
};
</script>

<style scoped lang="scss">
.diff-channel {
  margin-left: -30px;
  margin-right: -100px;
  position: relative;
}

.diff-channel-marker {
  position: absolute;
  height: 100%;
  width: 29px;
  top: 0;
  border-right: 1px solid $gray4;

  .diff-channel-label {
    font-size: 9pt;
    color: $gray4;
    text-align: center;
  }
}

.call.diff-insert .diff-channel {
  background-color: $sequence-diff-insert-bg-color;
}

.call.diff-change .diff-channel {
  background-color: $sequence-diff-change-bg-color;
}

.call.diff-delete .diff-channel {
  background-color: $sequence-diff-delete-bg-color;
}
</style>
