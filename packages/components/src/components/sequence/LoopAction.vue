<template>
  <div
    :class="loopClasses"
    :style="{
      'grid-column': gridColumns,
      'grid-row': gridRows,
    }"
  >
    <div class="label-container">
      <div class="label">Loop</div>
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

export default {
  name: 'v-sequence-loop',

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
      const gridEndFactor =
        this.actionSpec.action.children.reduce((accumulator, child) => {
          // add an extra grid row if the loop has a single child with no return value
          if (!child.returnValue && child.children.length === 0) {
            return accumulator + 1;
          }
          return accumulator;
        }, 2) || 2;

      return [this.actionSpec.index + 2, this.actionSpec.returnIndex! + gridEndFactor].join(' / ');
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
  border: 2px solid #444e69;
  position: relative;
  display: inline-block;
  font-weight: bold;
  pointer-events: none;
  border-radius: 0.4rem;

  .label-container {
    white-space: nowrap;
    background-color: #444e69;
    div {
      display: inline-block;
    }

    .label {
      padding: 5px;
      height: 28px;
      background-color: #444e69;
      color: $white;
      border-bottom: 2px solid #444e69;
      position: relative;

      .rhs-effect {
        position: absolute;
        top: 0;
        left: 100%;
      }
    }

    .description {
      font-size: 9pt;
      font-weight: 400;
      color: #9297a5;

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
