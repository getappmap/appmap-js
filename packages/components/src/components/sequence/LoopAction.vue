<template functional>
  <div
    :class="$options.loopClasses(props.isCollapsed)"
    :style="{
      'grid-column': $options.gridColumns(props.actionSpec),
      'grid-row': $options.gridRows(props.actionSpec),
    }"
  >
    <div class="label-container">
      <div class="label">Loop</div>
      <div class="description">
        [
        <div class="count">{{ props.actionSpec.action.count }} times</div>
        <div class="elapsed">{{ props.actionSpec.elapsedTimeMs }}ms</div>
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
    isCollapsed: {
      type: Boolean,
      required: true,
      readonly: true,
    },
  },
  loopClasses(isCollapsed: boolean): string[] {
    const result = ['loop'];
    if (isCollapsed) result.push('loop-collapsed');
    return result;
  },
  gridRows(actionSpec: ActionSpec): string {
    return [actionSpec.index + 2, actionSpec.returnIndex! + 2].join(' / ');
  },
  gridColumns(actionSpec: ActionSpec): string {
    const [min, max] = actionSpec.descendantsActorIndexSpan;
    return [min + 2, max + 2].join(' / ');
  },
};
</script>

<style scoped lang="scss">
.loop {
  margin: 15px -20px 10px -20px;
  border: 2px solid $gray2;
  position: relative;
  display: inline-block;
  font-weight: bold;
  pointer-events: none;
  border-radius: 0;
  .label-container {
    white-space: nowrap;
    background-color: $gray2;
    div {
      display: inline-block;
    }

    .label {
      padding: 5px;
      height: 28px;
      background-color: $actor-highlight;
      color: $white;
      border-bottom: 2px solid $gray2;
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
