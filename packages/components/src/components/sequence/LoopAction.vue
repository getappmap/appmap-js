<template>
  <div
    :class="loopClasses"
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
    collapsedActions: {
      type: Array,
      required: true,
    },
  },

  data() {
    return {
      collapsedActionState: this.collapsedActions,
      columnIndexSpan: this.actionSpec.descendantsActorIndexSpan,
    };
  },

  computed: {
    loopClasses(): string[] {
      const result = ['loop'];

      if (this.actionSpec.isCollapsed(this.collapsedActionState)) result.push('loop-collapsed');

      return result;
    },

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
  border: 2px solid $dark-purple; // #6fddd6bb;
  position: relative;
  display: inline-block;
  font-weight: bold;
  pointer-events: none;

  .label-container {
    white-space: nowrap;
    background-color: #4f3fa199; // #1b3046;

    div {
      display: inline-block;
    }

    .label {
      padding: 5px;
      height: 28px;
      background-color: $dark-purple; //#6fddd6;
      color: black;
      border-bottom: 2px solid $dark-purple; //#6fddd6bb;
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

.loop-collapsed {
  display: none;
}
</style>
