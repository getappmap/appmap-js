<template>
  <div class="label" @click="selectEvent">
    <div :class="nameClasses">
      <template v-for="text in name">
        <span :class="text.class">{{ text.text }}</span>
      </template>
    </div>
    <template v-if="actionSpec.hasElapsed">
      <span class="elapsed">{{ actionSpec.elapsedTimeMs }} ms</span>
    </template>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import { diffChars } from 'diff';
import { DiffMode, isFunction } from '@appland/sequence-diagram';
import { ActionSpec } from './ActionSpec';
import { SELECT_OBJECT } from '@/store/vsCode';

class LabelFragment {
  constructor(public text: string, public diffMode?: DiffMode.Insert | DiffMode.Delete) {}

  get class(): string[] {
    const result = [];
    if (this.diffMode === DiffMode.Delete) {
      result.push('delete');
    } else if (this.diffMode === DiffMode.Insert) {
      result.push('insert');
    }
    return result;
  }
}

const ChangedCharsThreshod = 0.25;

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
    nameClasses(): string[] {
      const result = ['name'];
      if (isFunction(this.actionSpec.action) && this.actionSpec.action.static) {
        result.push('static');
      }
      return result;
    },
    name(): LabelFragment[] {
      if (!this.actionSpec.action.formerName)
        return [new LabelFragment(this.actionSpec.nodeName, this.actionSpec.action.diffMode)];

      const result: LabelFragment[] = [];

      const formerLabel = this.actionSpec.action.formerName;
      const label = this.actionSpec.nodeName;
      const diff = diffChars(formerLabel, label);
      const changeCharsCount = diff.reduce(
        (memo, change) => (change.added || change.removed ? memo + (change.count || 0) : memo),
        0
      );
      if (changeCharsCount / Math.max(formerLabel.length, label.length) < ChangedCharsThreshod) {
        for (const change of diff) {
          const text = change.value;
          if (change.removed) {
            result.push(new LabelFragment(text, DiffMode.Delete));
          } else {
            result.push(new LabelFragment(text, DiffMode.Insert));
          }
        }
      } else {
        result.push(new LabelFragment(formerLabel, DiffMode.Delete));
        result.push(new LabelFragment(label, DiffMode.Insert));
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
$bg-fade: rgba(0, 0, 0, 0.8);

.label {
  display: inline-block;
  font-size: 9pt;
  margin-left: 1em;
  white-space: nowrap;
  max-width: 160px;
  text-overflow: ellipsis;

  .name {
    display: inline-block;
    background-color: $bg-fade;
  }

  .name.static {
    text-decoration: underline;
  }

  .name > .delete {
    text-decoration: line-through;
    color: $gray4;
  }

  .elapsed {
    color: $sequence-elapsed-time-color;
    background-color: $bg-fade;
  }
}

.label:hover {
  cursor: pointer;
  color: $lightblue;
}
</style>
