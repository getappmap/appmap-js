<template>
  <div class="label">
    <span :class="classes">{{ actionSpec.nodeName }}</span>
    <template v-if="actionSpec.hasElapsed">
      <span class="elapsed">{{ actionSpec.elapsedTimeMs }} ms</span>
    </template>
  </div>
</template>

<script lang="ts">
import { isFunction } from '@appland/sequence-diagram';
import { ActionSpec } from './ActionSpec';

export default {
  name: 'v-sequence-call-label',

  components: {},

  props: {
    actionSpec: {
      type: ActionSpec,
      required: true,
      readonly: true,
    },
  },

  computed: {
    classes(): string[] {
      const result = ['name'];
      if (isFunction(this.actionSpec.action) && this.actionSpec.action.static) {
        result.push('static');
      }
      return result;
    },
  },
};
</script>

<style scoped lang="scss">
// See also: ReturnLabel .label
.label {
  display: inline-block;
  font-size: 9pt;
  margin-left: 1em;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name.static {
  text-decoration: underline;
}

.elapsed {
  color: lightgray;
}
</style>
