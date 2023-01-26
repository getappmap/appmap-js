<template>
  <div
    :class="['return', `return-${actionSpec.callArrowDirection}`].join(' ')"
    :data-comment="`${actionSpec.nodeResult} spans from ${actionSpec.calleeActionIndex} to
      ${actionSpec.callerActionIndex}`"
  >
    <template v-if="actionSpec.callArrowDirection === 'self'">
      <div
        class="self-return"
        :style="{
          'grid-column': actionSpec.callerActionIndex,
          'grid-row': gridRows,
        }"
      >
        <VReturnLabel :action-spec="actionSpec" />
      </div>
    </template>
    <template v-else-if="actionSpec.callArrowDirection === 'right'">
      <div
        class="return-line-segment label-span arrow-head"
        :style="{
          'grid-column': actionSpec.callerActionIndex,
          'grid-row': gridRows,
        }"
      >
        <VReturnLabel :action-spec="actionSpec" />
        <ArrowRight class="arrow" />
      </div>
      <template v-if="actionSpec.calleeActionIndex - actionSpec.callerActionIndex > 2">
        <div
          class="return-line-segment connecting-span"
          :style="{
            'grid-column': [
              actionSpec.callerActionIndex + 1,
              actionSpec.calleeActionIndex - 1,
            ].join(' / '),
            'grid-row': gridRows,
          }"
        ></div>
      </template>
      <div
        class="return-line-segment arrow-base"
        :style="{ 'grid-column': actionSpec.calleeActionIndex - 1, 'grid-row': gridRows }"
      ></div>
    </template>
    <template v-else>
      <div
        class="return-line-segment arrow-base"
        :style="{ 'grid-column': actionSpec.calleeActionIndex, 'grid-row': gridRows }"
      ></div>
      <template v-if="actionSpec.callerActionIndex - actionSpec.calleeActionIndex > 2">
        <div
          class="return-line-segment connecting-span"
          :style="{
            'grid-column': [
              actionSpec.calleeActionIndex + 1,
              actionSpec.callerActionIndex - 1,
            ].join(' / '),
            'grid-row': gridRows,
          }"
        ></div>
      </template>
      <div
        class="return-line-segment label-span arrow-head"
        :style="{
          'grid-column': actionSpec.callerActionIndex - 1,
          'grid-row': gridRows,
        }"
      >
        <VReturnLabel :action-spec="actionSpec" />
        <ArrowRight class="arrow" />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import ArrowRight from '@/assets/arrow-right.svg';
import { ActionSpec } from './ActionSpec';
import VReturnLabel from './ReturnLabel.vue';

export default {
  name: 'v-sequence-return-action',

  components: { ArrowRight, VReturnLabel },

  props: {
    actionSpec: {
      type: ActionSpec,
      required: true,
      readonly: true,
    },
  },

  computed: {
    gridRows(): string {
      return [this.actionSpec.index + 2, this.actionSpec.index + 2].join(' / ');
    },
  },
};
</script>

<style scoped lang="scss">
.return {
  position: relative;
  padding: 3px 0;
  display: contents;

  > div {
    margin: 2px 0;
    padding: 5px 0;
  }
}

.return-line-segment {
  border-bottom: 2px dotted magenta;
}

.return-right {
  .arrow-base {
    width: calc(100%);
  }

  .arrow-head {
    position: relative;
  }

  .arrow {
    left: 0px;
    transform: rotate(180deg);
    position: absolute;
    bottom: -7px;
  }
}

.return-left {
  .arrow-head {
    width: calc(100% - 4px);
    position: relative;
  }

  .arrow {
    right: -4px;
    position: absolute;
    bottom: -7px;
  }
}
</style>
