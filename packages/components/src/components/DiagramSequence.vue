<template>
  <div class="sequence-diagram">
    <template v-for="(actor, index) in actors">
      <VActor
        :actor="actor"
        :row="1"
        :index="index"
        :height="diagramSpec.rowCount"
        :selected-actor="selectedActor"
      />
    </template>
    <template v-for="action in diagramSpec.actions">
      <template v-if="action.nodeType === 'call'">
        <VCallAction :actionSpec="action" :selected-actions="selectedActions" />
      </template>
      <template v-if="action.nodeType === 'return'">
        <VReturnAction :actionSpec="action" :selected-actions="selectedActions" />
      </template>
    </template>
    <template v-for="action in diagramSpec.actions">
      <template v-if="action.nodeType === 'loop'"><VLoopAction :actionSpec="action" /></template>
    </template>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { AppMap, CodeObject, Event } from '@appland/models';
import {
  buildDiagram,
  unparseDiagram,
  Action,
  Diagram,
  Specification,
} from '@appland/sequence-diagram';
import VLoopAction from '@/components/sequence/LoopAction.vue';
import VCallAction from '@/components/sequence/CallAction.vue';
import VReturnAction from '@/components/sequence/ReturnAction.vue';
import VActor from '@/components/sequence/Actor.vue';
import DiagramSpec from './sequence/DiagramSpec';
import assert from 'assert';

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
    diagramSpec() {
      return new DiagramSpec(this.diagram);
    },
    actors() {
      return this.diagram.actors;
    },
    selectedActions() {
      if (!this.selectedEvents || this.selectedEvents.length === 0) return;

      const selectedEventIds = (this.selectedEvents as Event[]).map((event) => event.id);
      const result: Action[] = [];
      const collectActions = (action: Action) => {
        if ((action.eventIds || []).find((id) => selectedEventIds.indexOf(id) !== -1))
          result.push(action);
        action.children.forEach(collectActions);
      };
      this.diagram.rootActions.forEach((action) => collectActions(action));
      return result;
    },
    selectedActor() {
      if (!this.$store) return;
      if (!this.$store.getters.selectedObject) return;
      if (!(this.$store.getters.selectedObject instanceof CodeObject)) return;

      const codeObject = this.$store.getters.selectedObject as CodeObject;
      console.log(codeObject.fqid);
      const ancestorIds = [
        codeObject.fqid,
        ...(codeObject as any).ancestors().map((ancestor: CodeObject) => ancestor.fqid),
      ];
      console.log(ancestorIds);
      return this.actors.find((actor) => ancestorIds.indexOf(actor.id) !== -1);
    },
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
  padding: 10px 100px 20px 30px;
  width: fit-content;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 10pt;
  color: white;
}
</style>
