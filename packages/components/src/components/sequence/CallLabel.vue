<template>
  <div class="label" @click="selectEvent">
    <span :class="classes">{{ actionSpec.nodeName }}</span>
    <template v-if="actionSpec.hasElapsed">
      <span class="elapsed">{{ actionSpec.elapsedTimeMs }} ms</span>
    </template>
  </div>
</template>

<script lang="ts">
import { isFunction } from '@appland/sequence-diagram';
import { ActionSpec } from './ActionSpec';
import { SELECT_OBJECT } from '@/store/vsCode';

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
  methods: {
    selectEvent() {
      if (this.$store) {
        const eventId = this.actionSpec.action.eventIds[0];
        if (eventId === undefined) return;

        const event = this.$store.state.appMap.events[eventId - 1];
        if (event) this.$store.commit(SELECT_OBJECT, event);
      }
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

.label:hover {
  cursor: pointer;
  color: $lightblue;
}

.name.static {
  text-decoration: underline;
}

.elapsed {
  color: $sequence-elapsed-time-color;
}
</style>
