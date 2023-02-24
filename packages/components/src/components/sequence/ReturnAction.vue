<template>
  <div
    :class="containerClasses"
    :data-comment="`${actionSpec.nodeResult} spans from ${actionSpec.calleeActionIndex} to
      ${actionSpec.callerActionIndex}`"
  >
    <template v-if="actionSpec.action.diffMode">
      <v-diff-channel :action-spec="actionSpec" />
    </template>
    <template v-if="actionSpec.callArrowDirection === 'self'">
      <div
        class="self-return"
        :style="{
          ...actionSpec.groupMemberAttributes,
          ...actionSpec.lifecycleAttributes,
          ...{
            'grid-column': actionSpec.callerActionIndex,
            'grid-row': gridRows,
          },
        }"
      >
        <VReturnLabel :action-spec="actionSpec" />
      </div>
    </template>
    <template v-else-if="actionSpec.callArrowDirection === 'right'">
      <template v-if="actionSpec.calleeActionIndex - actionSpec.callerActionIndex === 1">
        <div
          class="return-line-segment single-span"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.callerActionIndex,
              'grid-row': gridRows,
            },
          }"
        >
          <VReturnLabel :action-spec="actionSpec" />
          <Arrow class="arrow" />
        </div>
      </template>
      <template v-else>
        <div
          class="return-line-segment label-span arrow-head"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.callerActionIndex,
              'grid-row': gridRows,
            },
          }"
        >
          <VReturnLabel :action-spec="actionSpec" />
          <Arrow class="arrow" />
        </div>
        <template v-if="actionSpec.calleeActionIndex - actionSpec.callerActionIndex > 2">
          <div
            class="return-line-segment connecting-span"
            :style="{
              ...actionSpec.groupMemberAttributes,
              ...actionSpec.lifecycleAttributes,
              ...{
                'grid-column': [
                  actionSpec.callerActionIndex + 1,
                  actionSpec.calleeActionIndex - 1,
                ].join(' / '),
                'grid-row': gridRows,
              },
            }"
          ></div>
        </template>
        <div
          class="return-line-segment arrow-base"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{ 'grid-column': actionSpec.calleeActionIndex - 1, 'grid-row': gridRows },
          }"
        ></div>
      </template>
    </template>
    <template v-else>
      <template v-if="actionSpec.callerActionIndex - actionSpec.calleeActionIndex === 1">
        <div
          class="return-line-segment single-span"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.calleeActionIndex,
              'grid-row': gridRows,
            },
          }"
        >
          <VReturnLabel :action-spec="actionSpec" />
          <Arrow class="arrow" />
        </div>
      </template>
      <template v-else>
        <div
          class="return-line-segment arrow-base"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{ 'grid-column': actionSpec.calleeActionIndex, 'grid-row': gridRows },
          }"
        ></div>
        <template v-if="actionSpec.callerActionIndex - actionSpec.calleeActionIndex > 2">
          <div
            class="return-line-segment connecting-span"
            :style="{
              ...actionSpec.groupMemberAttributes,
              ...actionSpec.lifecycleAttributes,
              ...{
                'grid-column': [
                  actionSpec.calleeActionIndex + 1,
                  actionSpec.callerActionIndex - 1,
                ].join(' / '),
                'grid-row': gridRows,
              },
            }"
          ></div>
        </template>
        <div
          class="return-line-segment label-span arrow-head"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.callerActionIndex - 1,
              'grid-row': gridRows,
            },
          }"
        >
          <VReturnLabel :action-spec="actionSpec" />
          <Arrow class="arrow" />
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import Arrow from '@/assets/sequence-action-arrow.svg';
import { ActionSpec } from './ActionSpec';
import VReturnLabel from './ReturnLabel.vue';
import VDiffChannel from './DiffChannel.vue';

export default {
  name: 'v-sequence-return-action',

  components: { Arrow, VReturnLabel, VDiffChannel },

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
    };
  },

  computed: {
    containerClasses(): string[] {
      const result = [
        'return',
        `return-${this.actionSpec.callArrowDirection}`,
        ...this.actionSpec.diffClasses,
      ];

      const caller: ActionSpec = this.actionSpec.diagramSpec.actions[this.actionSpec.callIndex];
      if (caller.isCollapsed(this.collapsedActionState)) result.push('return-collapsed');

      if (this.actionSpec.index === 0) result.push('first-action');

      return result;
    },
    gridRows(): string {
      return [this.actionSpec.index + 2, this.actionSpec.index + 2].join(' / ');
    },
  },
};
</script>

<style scoped lang="scss">
.return {
  position: relative;
  padding-top: 4px;
  display: contents;
}

.return-collapsed {
  display: none;
}

.return-line-segment {
  border-bottom: $sequence-call-line-width dotted $sequence-call-line-color;
}

.return-line-segment,
.self-return {
  margin-bottom: calc(var(--close-group-count) * 40px);
  padding-top: 10px;
}

.arrow {
  fill: $sequence-call-line-color;
}

.single-span {
  width: calc(
    100% -
      (
        (var(--caller-lifecycle-depth) + var(--callee-lifecycle-depth)) *
          $sequence-activation-gutter-width
      )
  );
  position: relative;
}

.arrow-base {
  width: calc(100% - (var(--callee-lifecycle-depth) * $sequence-activation-gutter-width));
  position: relative;
}

.arrow-head {
  width: calc(100% - ((var(--caller-lifecycle-depth)) * $sequence-activation-gutter-width));
  position: relative;
}

.return-right {
  .single-span {
    left: calc(((var(--caller-lifecycle-depth)) * $sequence-activation-gutter-width));
  }

  .arrow-head {
    left: calc((var(--caller-lifecycle-depth) * $sequence-activation-gutter-width));
  }

  .arrow {
    left: 0px;
    transform: rotate(180deg);
    position: absolute;
    bottom: -7px;
    z-index: 9999;
  }
}

.return-left {
  .single-span {
    left: calc(((var(--callee-lifecycle-depth)) * $sequence-activation-gutter-width));
  }

  .arrow-base {
    left: calc((var(--callee-lifecycle-depth) * $sequence-activation-gutter-width));
  }

  .arrow {
    right: 0px;
    position: absolute;
    bottom: -7px;
  }
}

.return.diff {
  &.diff-delete {
    .return-line-segment {
      border-bottom: $sequence-call-line-width dotted rgba(185, 25, 33, 1);
      .arrow {
        fill: rgba(185, 25, 33, 1);
      }
    }
  }
  &.diff-insert {
    .return-line-segment {
      border-bottom: $sequence-call-line-width dotted rgba(10, 110, 52, 1);
      .arrow {
        fill: rgba(10, 110, 52, 1);
      }
    }
  }
  &.diff-change {
    .return-line-segment {
      border-bottom: $sequence-call-line-width dotted rgba(45, 71, 103, 1);
      .arrow {
        fill: rgba(45, 71, 103, 1);
      }
    }
  }
}
</style>
