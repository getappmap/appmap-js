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
// @ts-nocheck
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
      if (this.actionSpec.action.diffMode === DiffMode.Delete) return '-';
      if (this.actionSpec.action.diffMode === DiffMode.Change) return '+/-';
      if (this.actionSpec.action.diffMode === DiffMode.Move) return '↷';

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

@each $mode, $colors in $sequence-diff-modes {
  .diff-#{$mode} .diff-channel {
    background-color: map-get($colors, channel);
    .diff-channel-marker {
      background-color: rgba(map-get($colors, line), map-get($colors, marker-opacity));
    }
  }
}
</style>
}
