<template>
  <div class="sequence-diagram">
    <template v-for="(actor, index) in actors">
      <VActor :actor="actor" :row="1" :index="index" :height="diagramSpec.rowCount" />
    </template>
    <template v-for="action in diagramSpec.actions">
      <template v-if="action.nodeType === 'loop'"><VLoopAction :actionSpec="action" /></template>
      <template v-if="action.nodeType === 'call'">
        <VCallAction :actionSpec="action" />
      </template>
      <template v-if="action.nodeType === 'return'">
        <VReturnAction :actionSpec="action" />
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { Diagram, unparseDiagram } from '@appland/sequence-diagram';
import VLoopAction from '@/components/sequence/LoopAction.vue';
import VCallAction from '@/components/sequence/CallAction.vue';
import VReturnAction from '@/components/sequence/ReturnAction.vue';
import VActor from '@/components/sequence/Actor.vue';
import DiagramSpec from './sequence/DiagramSpec';

export default {
  name: 'v-diagram-sequence',

  components: { VLoopAction, VCallAction, VReturnAction, VActor },

  props: {
    diagram: {
      type: Object,
      required: true,
      readonly: true,
    },
  },
  data() {
    const diagramObject = unparseDiagram(this.diagram as Diagram);
    const diagramSpec = new DiagramSpec(diagramObject);

    return {
      actors: diagramObject.actors,
      diagramSpec,
    };
  },
};
</script>

<style scoped lang="scss">
.sequence-diagram {
  display: grid;
  background-color: black;
  gap: 0;
  padding: 1em;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 10pt;
  color: white;
}
</style>
