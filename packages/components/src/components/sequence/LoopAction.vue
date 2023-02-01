<template>
  <div
    class="loop"
    :style="{
      'grid-column': gridColumns,
      'grid-row': gridRows,
    }"
  >
    <div class="label-container">
      <div class="label">
        Loop
        <div class="rhs-effect">
          <SequenceGroupLabelRHS />
        </div>
      </div>
      <div class="description">
        [
        <div class="count">{{ actionSpec.action.count }} times</div>
        <div class="elapsed">{{ actionSpec.elapsedTimeMs }}ms</div>
        ]
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { ActionSpec } from './ActionSpec';
import SequenceGroupLabelRHS from '@/assets/sequence-group-label-rhs.svg';

export default {
  name: 'v-sequence-loop',

  components: { SequenceGroupLabelRHS },

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
  z-index: 3;
  display: inline-block;
  font-weight: bold;

  .label-container {
    white-space: nowrap;
    background-color: rgba(200, 200, 200, 0.25);

    div {
      display: inline-block;
    }

    .label {
      padding: 5px;
      height: 28px;
      background-color: #6fddd6;
      color: black;
      border-bottom: 2px solid magenta;
      position: relative;

      .rhs-effect {
        position: absolute;
        top: 0;
        left: 100%;
      }
    }

    .description {
      font-size: 9pt;
      margin-left: 20px;

      .elapsed {
        color: $sequence-elapsed-time-color;
      }
    }
  }
}
</style>
