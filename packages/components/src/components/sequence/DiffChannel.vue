{
<template>
  <div
    class="diff-channel"
    :style="{
      'grid-column': [1, maxGridColumn + 1].join(' / '),
      'grid-row': gridRows,
    }"
  >
    <div class="diff-channel-marker">
      <span class="diff-channel-label">
        {{ diffRowLabel }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
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
  border-right: 1px solid lighten($gray4, 20);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;

  .diff-channel-label {
    font-size: 9pt;
    color: lighten($gray4, 20);
  }
}

.diff-insert .diff-channel {
  background-color: $sequence-diff-insert-bg-color;
  .diff-channel-marker {
    background-color: rgba(10, 110, 52, 0.5);
  }
}

.diff-change .diff-channel {
  background-color: $sequence-diff-change-bg-color;
  .diff-channel-marker {
    background-color: rgba(45, 71, 103, 0.67);
  }
}

.diff-delete .diff-channel {
  background-color: $sequence-diff-delete-bg-color;
  .diff-channel-marker {
    background-color: rgba(185, 25, 33, 0.5);
  }
}
</style>
}
