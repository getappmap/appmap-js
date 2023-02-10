<template>
  <div
    :class="classes"
    :style="{
      ...actionSpec.groupMemberAttributes,
      ...actionSpec.lifecycleAttributes,
    }"
  >
    <template v-if="actionSpec.returnIndex">
      <SelfCallWithReturn />
      <Arrow class="arrow" />
    </template>
    <template v-else>
      <SelfCallNoReturn />
      <Arrow class="arrow" />
    </template>
  </div>
</template>

<script lang="ts">
// @ts-nocheck

import { ActionSpec } from './ActionSpec';
import Arrow from '@/assets/sequence-action-arrow.svg';
import SelfCallWithReturn from '@/assets/sequence-self-call-with-return.svg';
import SelfCallNoReturn from '@/assets/sequence-self-call-no-return.svg';

export default {
  name: 'v-sequence-self-call-arrow',

  components: { Arrow, SelfCallWithReturn, SelfCallNoReturn },

  props: {
    actionSpec: {
      type: ActionSpec,
      required: true,
      readonly: true,
    },
  },

  computed: {
    classes(): string[] {
      const result = ['self-call-arrow'];
      result.push(this.actionSpec.returnIndex !== undefined ? 'with-return' : 'no-return');
      return result;
    },
  },
};
</script>

<style scoped lang="scss">
.self-call-arrow {
  stroke: $sequence-call-line-color;
  position: absolute;
}

.self-call-arrow.with-return {
  transform: translate(
    calc(-25px - var(--caller-lifecycle-depth) * $sequence-activation-gutter-width),
    -9px
  );
}

.self-call-arrow.no-return {
  transform: translate(
    calc(-30px - var(--caller-lifecycle-depth) * $sequence-activation-gutter-width),
    -18px
  );
}

.arrow {
  stroke: $sequence-call-line-color;
  fill: $sequence-call-line-color;
}

.with-return .arrow {
  transform: translate(-22px, 5px);
}

.no-return .arrow {
  transform: rotate(-19deg) translate(-15px, -8.2px);
}
</style>
