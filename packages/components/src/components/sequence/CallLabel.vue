<template>
  <div class="label">
    <template v-if="collapseEnabled">
      <div :class="collapseClasses" @click="collapseOrExpand">{{ collapseExpandIndicator }}</div>
    </template>
    <div :class="nameClasses">
      <template v-for="text in name">
        <span @click="selectEvent" :class="text.class" :key="text.text">{{ text.text }}</span>
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
import { SELECT_CODE_OBJECT } from '@/store/vsCode';

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
    collapsedActions: {
      type: Array,
      required: true,
    },
    appMap: {
      type: Object,
    },
  },

  data() {
    return {
      collapsedActionState: this.collapsedActions,
    };
  },

  computed: {
    collapseEnabled(): boolean {
      if (this.actionSpec.action.children.length === 0) return false;

      return true;
    },
    collapsed(): boolean {
      return this.collapsedActionState[this.actionSpec.index];
    },
    collapseExpandIndicator(): string {
      return this.collapsed ? '[+]' : '[-]';
    },
    collapseClasses(): string[] {
      const result = ['collapse-expand'];
      result.push(this.collapsed ? 'collapsed' : 'expanded');
      return result;
    },
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
    collapseOrExpand() {
      this.$set(this.collapsedActionState, this.actionSpec.index, !this.collapsed);
    },
    selectEvent() {
      if (this.appMap) {
        const eventId = this.actionSpec.eventIds[0];
        if (eventId === undefined) return;

        const event = this.appMap.events.find((e) => e.id === eventId);
        if (event) this.$store.commit(SELECT_CODE_OBJECT, event);
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
  margin-left: 0.5rem;
  white-space: nowrap;
  max-width: 160px;
  text-overflow: ellipsis;

  .collapse-expand {
    display: inline-block;
    width: 1.5em;
    text-align: center;
  }

  .name {
    display: inline-block;
    padding: 2px 4px;
    border-radius: 3px;
    color: lighten($gray4, 20);
  }

  .name.static {
    text-decoration: underline;
    padding: 2px 4px;
    border-radius: 3px;
  }

  .name > .delete {
    text-decoration: line-through;
    color: $gray4;
    padding: 2px 4px;
    border-radius: 3px;
  }

  .elapsed {
    color: darken($gray4, 0);
    padding: 2px 4px;
    border-radius: 3px;
  }
}

.call.selected > .call-line-segment {
  .label {
    .name {
      color: $white;
    }
    .elapsed {
      color: #e3e5e8a6;
    }
  }
}

.name:hover,
.collapse-expand:hover {
  cursor: pointer;
  color: $lightblue;
}
</style>
