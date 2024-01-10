<template>
  <div :class="classes">
    <template v-if="collapseEnabled">
      <div
        :class="collapseClasses"
        @click="collapseOrExpand"
        @mouseover="startHoverExpandCollapse"
        @mouseout="stopHoverExpandCollapse"
      >
        {{ collapseExpandIndicator }}
      </div>
    </template>
    <div :class="nameClasses">
      <template v-for="text in name">
        <div
          :key="actionSpec.index + text.text"
          :style="{
            overflow: 'hidden',
            // Text baseline changes when overflow: hidden, so we need next two properties
            // https://stackoverflow.com/a/37427386
            display: 'inline-block',
            verticalAlign: 'bottom',
            textOverflow: 'ellipsis',
            // Constrain maxWidth with number_of_lanes * max_lane_width
            // 160 comes from the style rule .label { max-width: 160px; ... } below
            maxWidth:
              Math.max(1, Math.abs(actionSpec.calleeActionIndex - actionSpec.callerActionIndex)) *
                160 +
              'px',
          }"
        >
          <span v-if="hoverExpandCollapse" class="tooltip">
            {{ isCollapsed ? 'Expand' : 'Collapse' }}
          </span>
          <span
            @click="selectEvent"
            :class="text.class"
            :key="actionSpec.index + text.text"
            :title="sqlize"
            @mouseover="startHover"
            @mouseout="stopHover"
          >
            {{ text.text }}
          </span>
          <span v-if="hover && parameters" class="tooltip">{{ parameters }}</span>
        </div>
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
    isCollapsed: {
      type: Boolean,
      default: false,
    },
    interactive: {
      type: Boolean,
      required: true,
      readonly: true,
    },
    appMap: {
      type: Object,
    },
  },

  data() {
    return {
      hover: false,
      hoverExpandCollapse: false,
    };
  },

  computed: {
    classes(): { [key: string]: boolean } {
      return {
        label: true,
        interactive: this.interactive,
      };
    },
    collapseEnabled(): boolean {
      if (!this.interactive) return false;

      if (this.actionSpec.action.children.length === 0) return false;

      return true;
    },
    collapseExpandIndicator(): string {
      return this.isCollapsed ? '[+]' : '[-]';
    },
    collapseClasses(): string[] {
      const result = ['collapse-expand'];
      result.push(this.isCollapsed ? 'collapsed' : 'expanded');
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
    currentEvent() {
      if (!this.appMap) return null;
      if (!this.actionSpec.action.eventIds) return null;
      const eventId = this.actionSpec.action.eventIds[0];
      return this.appMap.eventsById[eventId];
    },
    sqlize() {
      if (!this.currentEvent) return '';
      if (this.currentEvent.sql) {
        return `${this.currentEvent.sqlQuery} ${
          this.actionSpec.elapsedTimeMs ? `\n\n${this.actionSpec.elapsedTimeMs} ms` : ''
        }`;
      }
      return '';
    },
    parameters() {
      if (!this.currentEvent) return '';

      if (this.currentEvent.sql) return '';

      if (this.currentEvent.parameters) {
        return this.formatParameters(this.currentEvent.parameters);
      }

      if (this.currentEvent.message) {
        return this.formatParameters(this.currentEvent.message);
      }

      return '';
    },
  },
  methods: {
    collapseOrExpand() {
      this.$set(this.$store.state.collapsedActionState, this.actionSpec.index, !this.isCollapsed);
    },
    selectEvent() {
      if (this.appMap) {
        const eventId = this.actionSpec.eventIds[0];
        if (eventId === undefined) return;

        const event = this.appMap.events.find((e) => e.id === eventId);
        if (event) this.$store.commit(SELECT_CODE_OBJECT, event);
        else console.warn(`Event ${eventId} not found`);
      }
    },
    startHoverExpandCollapse() {
      this.hoverExpandCollapse = true;
    },
    stopHoverExpandCollapse() {
      this.hoverExpandCollapse = false;
    },
    startHover() {
      this.hover = true;
    },
    stopHover() {
      this.hover = false;
    },
    truncate(str) {
      const MAX_LENGTH = 75;
      const TRUNCATION_SUFFIX = '...';

      if (str.length > MAX_LENGTH) {
        return str.substring(0, MAX_LENGTH - TRUNCATION_SUFFIX.length) + TRUNCATION_SUFFIX;
      }
      return str;
    },
    formatParameters(parameters) {
      return parameters
        .map((p) => {
          const name = p?.name ?? '';
          const value = p?.value ?? 'null';
          return `${name}: ${this.truncate(value.toString())}`;
        })
        .join(', ');
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
  font-family: 'IBM Plex Mono', monospace;
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
    border-radius: 3px;
    background-color: rgba(0, 0, 0, 0.7);
    color: lighten($gray4, 20);
    display: inline-block;
    padding: 2px 4px;
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

.call.selected > .call-line-segment,
.call.selected > .self-call {
  .label {
    .name {
      color: $white;
    }
    .elapsed {
      color: #e3e5e8a6;
    }
  }
}

.interactive {
  .name:hover,
  .collapse-expand:hover {
    cursor: pointer;
    color: $lightblue;
  }
}
.tooltip {
  position: absolute;
  background-color: #fff;
  color: #000;
  border: 1px solid #ccc;
  padding: 5px;
  z-index: 99999;
  opacity: 0.9;
}
</style>
