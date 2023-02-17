<template>
  <div
    :class="containerClasses"
    ref="container"
    :data-event-ids="actionSpec.eventIds.join(' ')"
    :data-comment="`${actionSpec.nodeName} spans from ${actionSpec.callerActionIndex} to
      ${actionSpec.calleeActionIndex}`"
  >
    <template v-if="actionSpec.action.diffMode">
      <v-diff-channel :action-spec="actionSpec" />
    </template>
    <template v-if="actionSpec.callArrowDirection === 'self'">
      <div
        class="self-call"
        :style="{
          ...actionSpec.groupMemberAttributes,
          ...actionSpec.lifecycleAttributes,
          ...{
            'grid-column': actionSpec.callerActionIndex,
            'grid-row': gridRows,
          },
        }"
      >
        <VCallLabel :action-spec="actionSpec" :collapsed-actions="collapsedActionState" />
        <VSelfCallArrow :action-spec="actionSpec" />
      </div>
    </template>
    <template v-else-if="actionSpec.callArrowDirection === 'right'">
      <template v-if="actionSpec.calleeActionIndex - actionSpec.callerActionIndex === 1">
        <div
          class="call-line-segment single-span"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.callerActionIndex,
              'grid-row': gridRows,
            },
          }"
        >
          <VCallLabel :action-spec="actionSpec" :collapsed-actions="collapsedActionState" />
          <Arrow class="arrow" />
        </div>
      </template>
      <template v-else>
        <div
          class="call-line-segment label-span arrow-base"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.callerActionIndex,
              'grid-row': gridRows,
            },
          }"
        >
          <VCallLabel :action-spec="actionSpec" :collapsed-actions="collapsedActionState" />
        </div>
        <template v-if="actionSpec.calleeActionIndex - actionSpec.callerActionIndex > 2">
          <div
            class="call-line-segment connecting-span"
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
          class="call-line-segment arrow-head"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.calleeActionIndex - 1,
              'grid-row': gridRows,
            },
          }"
        >
          <Arrow class="arrow" />
        </div>
      </template>
    </template>
    <template v-else>
      <template v-if="actionSpec.callerActionIndex - actionSpec.calleeActionIndex === 1">
        <div
          class="call-line-segment single-span"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.calleeActionIndex,
              'grid-row': gridRows,
            },
          }"
        >
          <VCallLabel :action-spec="actionSpec" :collapsed-actions="collapsedActionState" />
          <Arrow class="arrow" />
        </div>
      </template>
      <template v-else>
        <div
          class="call-line-segment label-span arrow-head"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.calleeActionIndex,
              'grid-row': gridRows,
            },
          }"
        >
          <VCallLabel :action-spec="actionSpec" :collapsed-actions="collapsedActionState" />
          <Arrow class="arrow" />
        </div>
        <template v-if="actionSpec.callerActionIndex - actionSpec.calleeActionIndex > 2">
          <div
            class="call-line-segment connecting-span"
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
          class="call-line-segment arrow-base"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column': actionSpec.callerActionIndex - 1,
              'grid-row': gridRows,
            },
          }"
        ></div>
      </template>
    </template>

    <template v-if="showGutter">
      <template v-if="actionSpec.callArrowDirection === 'right'">
        <div
          class="gutter-container gutter-container-right"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column':
                Math.max(actionSpec.callerActionIndex, actionSpec.calleeActionIndex) - 1,
              'grid-row': [actionSpec.index + 2, actionSpec.returnIndex + 2].join(' / '),
            },
          }"
        >
          <div class="gutter"></div>
        </div>
      </template>
      <template v-else>
        <div
          class="gutter-container gutter-container-left"
          :style="{
            ...actionSpec.groupMemberAttributes,
            ...actionSpec.lifecycleAttributes,
            ...{
              'grid-column':
                Math.min(actionSpec.callerActionIndex, actionSpec.calleeActionIndex) - 1,
              'grid-row': [actionSpec.index + 2, actionSpec.returnIndex + 2].join(' / '),
            },
          }"
        >
          <div class="gutter"></div>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import Arrow from '@/assets/sequence-action-arrow.svg';
import { ActionSpec } from './ActionSpec';
import VCallLabel from './CallLabel.vue';
import VDiffChannel from './DiffChannel.vue';
import VSelfCallArrow from './SelfCallArrow.vue';

export default {
  name: 'v-sequence-call-action',

  components: { Arrow, VCallLabel, VDiffChannel, VSelfCallArrow },

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
    focusedEvent: {
      type: Object,
      default: null,
    },
    selectedEvents: {
      type: Array,
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
        'call',
        `call-${this.actionSpec.callArrowDirection}`,
        ...this.actionSpec.diffClasses,
      ];

      if (this.actionSpec.isCollapsed(this.collapsedActionState)) result.push('call-collapsed');

      if (this.actionSpec.index === 0) result.push('first-action');

      if (this.focusedEvent && this.actionSpec.eventIds.includes(this.focusedEvent.id))
        result.push('focused');

      if (
        this.selectedEvents &&
        this.selectedEvents.find((event) => this.actionSpec.eventIds.includes(event.id))
      ) {
        result.push('selected');
        this.$nextTick(() =>
          this.$el
            .querySelector('.self-call, .call-line-segment')
            .scrollIntoView({ behavior: 'smooth', block: 'center' })
        );
      }

      return result;
    },
    gridRows(): string {
      return this.actionSpec.gridRows;
    },
    firstGridColumn(): number {
      return [this.actionSpec.callerActionIndex, this.actionSpec.calleeActionIndex].sort()[0];
    },
    lastGridColumn(): number {
      let lastIndex = [
        this.actionSpec.callerActionIndex,
        this.actionSpec.calleeActionIndex,
      ].sort()[1];
      if (this.actionSpec.callArrowDirection === 'self') lastIndex += 1;
      return lastIndex;
    },
    maxGridColumn(): number {
      return this.actionSpec.maxGridColumn;
    },
    showGutter(): boolean {
      return !!this.actionSpec.returnIndex;
    },
  },
};
</script>

<style scoped lang="scss">
.call {
  position: relative;
  padding-top: 4px;
  display: contents;
}

.call.focused {
  .call-line-segment,
  .self-call {
    outline: 4px solid transparent;
    animation: node-focused 6s ease-out 0.25s;
  }
}

.call.selected > .call-line-segment {
  background-color: #6c8ba54f;
  &.arrow-base {
    border-radius: 0.5rem 0 0 0;
  }
  &.arrow-head {
    border-radius: 0 0.5rem 0 0;
  }
  &.single-span {
    border-radius: 0.5rem 0.5rem 0 0;
  }
}

@keyframes node-focused {
  from {
    background-color: #6c8ba54f;
  }
  to {
    background-color: black;
  }
}

.call-collapsed {
  display: none;
}

.call.diff > .gutter-container {
  background-color: transparent;
}

.call-line-segment {
  border-bottom: $sequence-call-line-width solid $sequence-call-line-color;
}

.call.diff {
  &.diff-delete {
    .call-line-segment {
      border-bottom: $sequence-call-line-width solid rgba(185, 25, 33, 1);
      .arrow {
        fill: rgba(185, 25, 33, 1);
      }
    }
  }

  &.diff-insert {
    .call-line-segment {
      border-bottom: $sequence-call-line-width solid rgba(10, 110, 52, 1);
      .arrow {
        fill: green;
      }
    }
  }

  &.diff-change {
    .call-line-segment {
      border-bottom: $sequence-call-line-width solid rgba(45, 71, 103, 1);
      .arrow {
        fill: rgba(45, 71, 103, 1);
      }
    }
  }
}

.call.diff {
  .call-line-segment {
    border-bottom: $sequence-call-line-width solid $gray4;
    .arrow {
      fill: $gray4;
    }
  }
}

.first-action {
  .call-line-segment,
  .diff-channel {
    margin-top: 80px;
  }
}

.call-line-segment,
.self-call {
  margin-top: calc(var(--open-group-count) * 50px);
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
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
  width: calc(100% - (var(--caller-lifecycle-depth) * $sequence-activation-gutter-width));
  position: relative;
}

.arrow-head {
  width: calc(100% - ((var(--callee-lifecycle-depth)) * $sequence-activation-gutter-width));
  position: relative;
}

.arrow {
  fill: $sequence-call-line-color;
}

.call-right {
  .single-span {
    left: calc(((var(--caller-lifecycle-depth)) * $sequence-activation-gutter-width));
  }

  .arrow-base {
    left: calc((var(--caller-lifecycle-depth) * $sequence-activation-gutter-width));
  }

  .arrow {
    right: 0px;
    position: absolute;
    bottom: -7px;
  }
}

.call.selected.call-right {
  .single-span {
    left: calc(((var(--caller-lifecycle-depth)) * $sequence-activation-gutter-width));
  }

  .arrow-base {
    left: calc((var(--caller-lifecycle-depth) * $sequence-activation-gutter-width));
  }
  .arrow-head,
  .connecting-span {
  }

  .connecting-span {
    border-radius: 0;
  }

  .arrow {
    right: 0px;
    position: absolute;
    bottom: -7px;
  }
}

.call-left {
  .single-span {
    left: calc(((var(--callee-lifecycle-depth)) * $sequence-activation-gutter-width));
  }

  .arrow-head {
    left: calc((var(--callee-lifecycle-depth) * $sequence-activation-gutter-width));
  }

  .arrow {
    left: 0px;
    transform: rotate(180deg);
    position: absolute;
    bottom: -7px;
  }
}

.gutter-container {
  position: relative;
  pointer-events: none;
}

.gutter {
  width: calc(var(--callee-lifecycle-depth) * $sequence-activation-gutter-width * 2);
  background-color: black;
  border: 1px solid gray;
  position: relative;
  height: calc(100% - 6px - (var(--open-group-count) + var(--close-group-count)) * 40px);
  top: calc(var(--open-group-count) * 40px + 35px);
  left: calc(100% - (var(--callee-lifecycle-depth) * $sequence-activation-gutter-width));
}
</style>
