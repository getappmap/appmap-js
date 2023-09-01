<template>
  <!-- Workaround for: Cannot use <template> as component root element because it may contain multiple nodes. -->
  <div>
    <template v-if="isLoading">
      <div class="sequence-diagram-loading"></div>
    </template>
    <template v-else>
      <div class="sequence-diagram" id="sequence-diagram-ui">
        <template v-for="(actor, index) in actors">
          <VActor
            :actor="actor"
            :key="actorKey(actor)"
            :row="1"
            :index="index"
            :height="diagramSpec.actions.length"
            :filter-disabled="filterDisabled"
            :interactive="interactive"
            :selected-actor="selectedActor"
            :appMap="appMap"
          />
        </template>
        <template v-for="action in diagramSpec.actions">
          <template v-if="action.nodeType === 'call'">
            <VCallAction
              :actionSpec="action"
              :key="actionKey(action)"
              :interactive="interactive"
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
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { AppMap, CodeObject } from '@appland/models';
import {
  buildDiagram,
  unparseDiagram,
  Diagram,
  Specification,
  Action,
} from '@appland/sequence-diagram';
import VLoopAction from '@/components/sequence/LoopAction.vue';
import VCallAction from '@/components/sequence/CallAction.vue';
import VReturnAction from '@/components/sequence/ReturnAction.vue';
import VActor from '@/components/sequence/Actor.vue';
import DiagramSpec from './sequence/DiagramSpec';
import { ActionSpec } from './sequence/ActionSpec';

const SCROLL_OPTIONS = { behavior: 'smooth', block: 'center', inline: 'center' };

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
    filterDisabled: {
      type: Boolean,
      default: false,
    },
    interactive: {
      type: Boolean,
      default: true,
    },
    selectedEvents: {
      type: Array,
    },
  },

  computed: {
    styles() {
      if (this.isLoading) return 'display: none;';

      return '';
    },
    isLoading() {
      return this.diagram === undefined;
    },
    baseActors() {
      let { appMap } = this.$store.state;
      if (!appMap) appMap = this.appMap;

      // TODO: optimize for performance building actor priority separately
      const specification = Specification.build(appMap, { loops: true });
      const diagram = buildDiagram('<an AppMap file>', appMap, specification);

      return diagram.actors;
    },
    priority() {
      const priority = {};

      this.baseActors.forEach((actor) => (priority[actor.id] = actor.order));

      this.$store.state.expandedPackages.forEach((expandedPackage) => {
        const basePriority = priority[expandedPackage.fqid];
        delete priority[expandedPackage.fqid];

        expandedPackage.classes.forEach((subClass, index) => {
          priority[subClass.fqid] = basePriority + index;
        });
      });

      return priority;
    },
    expand() {
      return this.$store.state.expandedPackages.map((expandedPackage) => expandedPackage.fqid);
    },
    diagram() {
      let result: Diagram | undefined;
      if (this.serializedDiagram) {
        result = unparseDiagram(this.serializedDiagram as Diagram);
      } else if (this.$store?.state?.precomputedSequenceDiagram) {
        result = this.$store.state.precomputedSequenceDiagram;
      } else if (this.appMap) {
        const appMapObj: AppMap | undefined = this.appMap as AppMap;
        const { priority, expand } = this;
        const specification = Specification.build(appMapObj, {
          loops: true,
          priority,
          expand,
        });
        result = buildDiagram('<an AppMap file>', appMapObj, specification);
      }
      return result;
    },
    diagramSpec(): DiagramSpec {
      const result = new DiagramSpec(this.diagram);
      this.collapsedActions = []; // eslint-disable-line vue/no-side-effects-in-computed-properties

      // If a Diagram contains any actions in diff mode, expand all ancestors of every diff action,
      // and collapse all other actions.
      const expandedActions = new Set<number>();
      const markExpandedActions = (action: Action, ancestors = new Array<Action>()) => {
        if (action.diffMode) {
          expandedActions.add(...action.eventIds);
          for (const ancestor of ancestors) expandedActions.add(...ancestor.eventIds);
        }
        if (action.children && action.children.length > 0) {
          ancestors.push(action);
          action.children.forEach((child) => markExpandedActions(child, ancestors));
          ancestors.pop();
        }
        return ancestors;
      };
      this.diagram?.rootActions.forEach((root) => markExpandedActions(root));
      expandedActions.delete(undefined);

      const shouldExpand = (action: Action) =>
        expandedActions.size === 0 || action.eventIds.some((id) => expandedActions.has(id));

      for (let index = 0; index < result.actions.length; index++)
        this.$set(this.collapsedActions, index, !shouldExpand(result.actions[index]));

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
    loadData(data) {
      this.serializedDiagram = data;
    },
    actorKey(actor: Actor): string {
      return ['actor', this.diagramSpec.uniqueId, actor.id].join(':');
    },
    actionKey(action: ActionSpec): string {
      return ['action', this.diagramSpec.uniqueId, action.index].join(':');
    },
    showFocusEffect() {
      setTimeout(() => {
        const element = this.$el.querySelector(
          '.call.focused .self-call, .call.focused .call-line-segment'
        );
        if (!element) {
          return;
        }

        element.scrollIntoView(SCROLL_OPTIONS);
      });
    },
    focusHighlighted() {
      setTimeout(() => {
        if (!this.$el || !this.$el.querySelector) return;

        const selected = this.$el.querySelector('.selected');
        if (selected && selected.firstElementChild) {
          selected.firstElementChild.scrollIntoView(SCROLL_OPTIONS);
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
