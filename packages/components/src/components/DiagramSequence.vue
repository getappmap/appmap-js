<template>
  <div>
    <div class="sequence-diagram">
      <template v-for="(actor, index) in actors">
        <VActor :actor="actor" :index="index" :height="actionCount" />
      </template>
      <template v-for="action in actionSpecs">
        <template v-if="action.nodeType === 'call'">
          <VCallAction :actionSpec="action" />
        </template>
        <template v-if="action.nodeType === 'return'">
          <VReturnAction :actionSpec="action" />
        </template>
        <template v-if="action.nodeType === 'loop'"></template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Action, Diagram, isLoop, nodeResult, unparseDiagram } from '@appland/sequence-diagram';
import VCallAction from '@/components/sequence/CallAction.vue';
import VReturnAction from '@/components/sequence/ReturnAction.vue';
import VActor from '@/components/sequence/Actor.vue';
import { ActionSpec } from './sequence/ActionSpec';

export default {
  name: 'v-diagram-sequence',

  components: { VCallAction, VReturnAction, VActor },

  props: {
    diagram: {
      type: Object,
      required: true,
      readonly: true,
    },
  },
  data() {
    const diagramObject = unparseDiagram(this.diagram as Diagram);
    const actionSpecs: ActionSpec[] = [];
    let actionCount = 0;
    const collectActions = (action: Action, specs: ActionSpec[]): void => {
      let childSpecs = specs;
      let spec: ActionSpec;
      let callSpec: ActionSpec | undefined;
      actionCount += 1;
      if (isLoop(action)) {
        const children: ActionSpec[] = [];
        spec = new ActionSpec(diagramObject, action, 'loop', specs.length);
        childSpecs = children;
      } else {
        callSpec = spec = new ActionSpec(diagramObject, action, 'call', specs.length);
      }
      specs.push(spec);
      action.children.forEach((child) => collectActions(child, childSpecs));
      if (!isLoop(action) && nodeResult(action)) {
        actionCount += 1;
        const returnSpec = new ActionSpec(diagramObject, action, 'return', specs.length);
        if (callSpec) callSpec.returnIndex = specs.length;
        specs.push(returnSpec);
      }
    };
    diagramObject.rootActions.forEach((action) => collectActions(action, actionSpecs));

    return {
      actors: diagramObject.actors,
      actionCount,
      actionSpecs,
    };
  },
};
</script>

<style scoped lang="scss">
.sequence-diagram {
  display: grid;
  gap: 0;
  background-color: black;
  padding: 1em;
}
</style>

<style lang="scss">
.sequence-diagram {
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 10pt;
  color: white;
}
</style>
