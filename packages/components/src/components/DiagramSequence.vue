<template>
  <div class="sequence-diagram" id="sequence-diagram-ui">
    <template v-for="(actor, index) in actors">
      <VActor
        :actor="actor"
        :key="actorKey(actor)"
        :row="1"
        :index="index"
        :height="diagramSpec.actions.length"
        :selected-actor="selectedActor"
        :appMap="appMap"
      />
    </template>
    <template v-for="action in diagramSpec.actions">
      <template v-if="action.nodeType === 'call'">
        <VCallAction
          :actionSpec="action"
          :key="actionKey(action)"
          :collapsed-actions="collapsedActions"
          :selected-events="selectedEvents"
          :focused-event="focusedEvent"
          :appMap="appMap"
        />
      </template>
      <template v-if="action.nodeType === 'return'">
        <VReturnAction
          :actionSpec="action"
          :collapsed-actions="collapsedActions"
          :key="actionKey(action)"
        />
      </template>
    </template>
    <template v-for="action in diagramSpec.actions">
      <template v-if="action.nodeType === 'loop'"
        ><VLoopAction
          :actionSpec="action"
          :collapsed-actions="collapsedActions"
          :key="actionKey(action)"
      /></template>
    </template>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { AppMap, CodeObject } from '@appland/models';
import { buildDiagram, unparseDiagram, Diagram, Specification } from '@appland/sequence-diagram';
import VLoopAction from '@/components/sequence/LoopAction.vue';
import VCallAction from '@/components/sequence/CallAction.vue';
import VReturnAction from '@/components/sequence/ReturnAction.vue';
import VActor from '@/components/sequence/Actor.vue';
import DiagramSpec from './sequence/DiagramSpec';
import assert from 'assert';
import { ActionSpec } from './sequence/ActionSpec';

export default {
  name: 'v-diagram-sequence',

  components: { VLoopAction, VCallAction, VReturnAction, VActor },

  props: {
    appMap: {
      type: Object,
    },
    serializedDiagram: {
      type: Object,
    },
    focusedEvent: {
      type: Object,
      default: null,
    },
    selectedEvents: {
      type: Array,
    },
  },

  computed: {
    diagram() {
      let result: Diagram | undefined;
      if (this.serializedDiagram) {
        result = unparseDiagram(this.serializedDiagram as Diagram);
      } else if (this.appMap) {
        const appMapObj: AppMap | undefined = this.appMap as AppMap;
        const specification = Specification.build(appMapObj, { loops: true });
        result = buildDiagram('<an AppMap file>', appMapObj, specification);
      }
      assert(result);
      return result;
    },
    diagramSpec(): DiagramSpec {
      const result = new DiagramSpec(this.diagram);
      this.collapsedActions = []; // eslint-disable-line vue/no-side-effects-in-computed-properties
      for (let index = 0; index < result.actions.length; index++)
        this.$set(this.collapsedActions, index, false);
      return result;
    },
    actors() {
      return this.diagram.actors;
    },
    selectedActor() {
      if (!this.$store) return;
      if (!this.$store.getters.selectedObject) return;
      if (!(this.$store.getters.selectedObject instanceof CodeObject)) return;

      const codeObject = this.$store.getters.selectedObject as CodeObject;
      const ancestorIds = [
        codeObject.fqid,
        ...(codeObject as any).ancestors().map((ancestor: CodeObject) => ancestor.fqid),
      ];
      return this.actors.find((actor) => ancestorIds.indexOf(actor.id) !== -1);
    },
  },

  methods: {
    actorKey(actor: Actor): string {
      return ['actor', this.diagramSpec.uniqueId, actor.id].join(':');
    },
    actionKey(action: ActionSpec): string {
      return ['action', this.diagramSpec.uniqueId, action.index].join(':');
    },
    // TODO: Determine if this is necessary/unused
    showFocusEffect() {
      setTimeout(() => {
        const element = this.$el.querySelector(
          '.call.focused .self-call, .call.focused .call-line-segment'
        );
        if (!element) {
          return;
        }

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    focusHighlighted() {
      setTimeout(() => {
        const selected = this.$el.querySelector('.selected');
        if (selected && selected.firstElementChild) {
          selected.firstElementChild.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
        }
      }, 16);
    },
  },

  mounted() {
    this.focusHighlighted();
  },
  activated() {
    this.focusHighlighted();
  },
  updated() {
    this.focusHighlighted();
  },
};
</script>

<style scoped lang="scss">
.sequence-diagram {
  display: grid;
  background-color: black;
  gap: 0;
  // Right padding to extend the background color beyond the right-most Actor box.
  // Bottom padding to extend below the last action line.
  padding: 0px 100px 20px 30px;
  width: fit-content;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 10pt;
  color: white;
  contain: paint;
}
</style>
