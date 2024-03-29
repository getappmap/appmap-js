<template>
  <!-- Workaround for: Cannot use <template> as component root element because it may contain multiple nodes. -->
  <div>
    <template v-if="isLoading">
      <div class="sequence-diagram-loading"></div>
    </template>
    <template v-else>
      <div class="sequence-diagram" id="sequence-diagram-ui">
        <template v-for="(actor, index) in visuallyReachableActors">
          <VActor
            :actor="actor"
            :key="actor.id"
            :row="1"
            :index="index"
            :height="actions.length"
            :interactive="interactive"
            :appMap="appMap"
          />
        </template>
        <template v-for="action in actions">
          <template v-if="action.nodeType === 'call'">
            <VCallAction
              :actionSpec="action"
              :key="actionKey(action)"
              :interactive="interactive"
              :appMap="appMap"
              :highlighted-event-index="highlightedEventIndex"
            />
          </template>
          <template v-if="action.nodeType === 'return'">
            <VReturnAction
              :actionSpec="action"
              :key="actionKey(action)"
              :return-value="returnValue(action)"
            />
          </template>
        </template>
        <template v-for="action in actions">
          <template v-if="action.nodeType === 'loop'"
            ><VLoopAction
              :actionSpec="action"
              :isCollapsed="isCollapsed(action)"
              :key="actionKey(action)"
          /></template>
        </template>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { AppMap, Event } from '@appland/models';
import {
  buildDiagram,
  unparseDiagram,
  Diagram,
  Specification,
  Action,
  getActors,
} from '@appland/sequence-diagram';
import VLoopAction from '@/components/sequence/LoopAction.vue';
import VCallAction from '@/components/sequence/CallAction.vue';
import VReturnAction from '@/components/sequence/ReturnAction.vue';
import VActor from '@/components/sequence/Actor.vue';
import DiagramSpec from './sequence/DiagramSpec';
import { ActionSpec } from './sequence/ActionSpec';
import { SET_FOCUSED_EVENT, SET_COLLAPSED_ACTION_STATE } from '../store/vsCode';

const SCROLL_OPTIONS = { behavior: 'smooth', block: 'center', inline: 'center' };
export const DEFAULT_SEQ_DIAGRAM_COLLAPSE_DEPTH = 3;

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
    interactive: {
      type: Boolean,
      default: true,
    },
    collapseDepth: {
      type: Number,
      default: DEFAULT_SEQ_DIAGRAM_COLLAPSE_DEPTH,
    },
    highlightedEventIndex: {
      type: Number,
      default: undefined,
    },
  },

  computed: {
    collapsedActionState: {
      get() {
        return this.$store?.state?.collapsedActionState || [];
      },
      set(value) {
        if (this.$store?.state?.collapsedActionState)
          this.$store.commit(SET_COLLAPSED_ACTION_STATE, value);
      },
    },
    selectedEvents() {
      const selectedObject = this.$store?.getters?.selectedObject;
      return selectedObject && selectedObject instanceof Event ? [selectedObject] : [];
    },
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

      const specification = Specification.build(appMap, { loops: true });
      return getActors(appMap, specification);
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
      if (!this.diagram || this.diagram.actors.length === 0) return;

      const result = new DiagramSpec(this.diagram);

      if (this.collapsedActionState && this.collapsedActionState.length > 0)
        result.determineVisuallyReachableActors(this.collapsedActionState);

      return result;
    },
    actions() {
      return this.diagramSpec?.actions || [];
    },
    actors() {
      return this.diagram.actors;
    },
    visuallyReachableActors() {
      return this.diagramSpec?.visuallyReachableActors || [];
    },
  },
  methods: {
    actionKey(action: ActionSpec): string {
      return `action:${action.index}:${action.action.digest}`;
    },
    isSelected(action: ActionSpec): boolean {
      return !!this.selectedEvents?.find(({ id }) => action.eventIds?.includes(id));
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
      this.$nextTick(() => {
        if (!this.$el || !this.$el.querySelector) return;

        const selected = this.$el.querySelector('.highlighted');
        if (selected && selected.firstElementChild)
          selected.firstElementChild.scrollIntoView(SCROLL_OPTIONS);
      });
    },
    focusSelected() {
      setTimeout(() => {
        if (!this.$el || !this.$el.querySelector) return;

        const selected = this.$el.querySelector('.selected');
        if (selected && selected.firstElementChild) {
          selected.firstElementChild.scrollIntoView(SCROLL_OPTIONS);
        }
      }, 16);
    },
    returnValue(action: ActionSpec): string {
      if (!action.eventIds || !this.appMap || !this.appMap.eventsById) {
        return '';
      }
      const eventId = action.eventIds[0];
      const event = this.appMap.eventsById[eventId];

      if (!event) return '';

      if (event.returnValue?.value) {
        return event.returnValue.value;
      }

      if (event.exceptions?.length) {
        const exception = event.exceptions[0];
        return `${exception.class} ${exception.message}`;
      }

      return '';
    },
    collapseActionsForCompactLook(actionSpecs: ActionSpec[], collapseDepth: number) {
      // Collapse any Actions that satisfy the following conditions:
      //
      // -Greater than collapseDepth levels deep in the stack
      // -Does not contain the Selected Action.

      const actionToActionSpec = new Map(
        actionSpecs.filter((a) => a.nodeType != 'return').map((a) => [a.action, a])
      );

      const visit = (action: Action) => {
        const actionSpec = actionToActionSpec.get(action);
        let descendantPreventingCollapseFound = false;

        for (const child of action.children) {
          const childHasDescendantPreventingCollapse = visit(child);

          if (
            !descendantPreventingCollapseFound &&
            (childHasDescendantPreventingCollapse || this.isSelected(child))
          )
            descendantPreventingCollapseFound = true;
        }

        const isCollapseExpandApplicable =
          action.children?.length > 0 && actionSpec.nodeType === 'call';

        if (isCollapseExpandApplicable) {
          const shouldCollapse =
            actionSpec?.ancestorIndexes.length >= collapseDepth &&
            !descendantPreventingCollapseFound;
          if (this.collapsedActionState[actionSpec?.index] != shouldCollapse)
            this.$set(this.$store.state.collapsedActionState, actionSpec?.index, shouldCollapse);
        }

        return descendantPreventingCollapseFound;
      };

      const rootActionSpecs = actionSpecs.filter((a) => a.ancestorIndexes.length === 0);

      rootActionSpecs.forEach((h) => visit(h.action));
    },
    getMaxActionDepth() {
      if (this.actions.length === 0) return undefined;
      return this.actions.reduce((maxDepth, action) => {
        const depth = action.ancestorIndexes.length;
        if (depth > maxDepth) return depth;
        return maxDepth;
      }, 0);
    },
    isCollapsed(action: ActionSpec) {
      return action.isCollapsed(this.collapsedActionState);
    },
    expandCollapsedAncestors(eventId) {
      // If there are hidden actions containing this event ensure
      // they are not hidden by expanding collapsed ancestors
      for (const actionSpec of this.actions) {
        if (!actionSpec.eventIds.includes(eventId)) continue;

        const collapsedAncestorIndexes = actionSpec.ancestorIndexes.filter(
          (ancestorIndex) => this.collapsedActionState[ancestorIndex]
        );

        if (this.collapseDepth < collapsedAncestorIndexes.length) {
          this.$emit('updateCollapseDepth', collapsedAncestorIndexes.length);
        }

        collapsedAncestorIndexes.forEach((index) => {
          this.$set(this.collapsedActionState, index, false);
        });
      }
    },
  },
  watch: {
    collapseDepth() {
      const diffMode = this.actions.some((a) => a.action.diffMode);
      if (!diffMode) this.collapseActionsForCompactLook(this.actions, this.collapseDepth);
    },
    highlightedEventIndex(newVal, oldVal) {
      if (newVal !== undefined && newVal !== oldVal) this.focusHighlighted();
    },
    '$store.state.focusedEvent': {
      handler(newVal) {
        if (newVal) {
          this.expandCollapsedAncestors(newVal.id);
        }
      },
    },
    '$store.getters.selectedObject': {
      handler(newVal) {
        if (newVal) {
          this.expandCollapsedAncestors(newVal.id);
          this.focusSelected();
        }
      },
    },
    '$store.state.currentView': {
      handler(newVal) {
        if (newVal === 'viewSequence') {
          this.selectedEvents.forEach((event) => {
            this.expandCollapsedAncestors(event.id);
          });
        }
      },
    },
  },
  mounted() {
    this.$emit('setMaxSeqDiagramCollapseDepth', this.getMaxActionDepth());
    this.focusSelected();
    this.focusHighlighted();
  },
  activated() {
    this.focusSelected();
    this.focusHighlighted();
  },
  updated() {
    this.$emit('setMaxSeqDiagramCollapseDepth', this.getMaxActionDepth());
  },
  created() {
    if (!this.diagram || this.diagram.actors.length === 0 || this.collapsedActionState.length > 0)
      return;

    // If a Diagram contains any actions in diff mode,
    // expand all ancestors of every diff action and collapse all other actions.
    const expandedActions = new Set<number>();
    let firstDiffAction: Action | undefined;

    const eventIds = (action: Action) => (action.eventIds || []).filter((id) => id !== undefined);

    const markExpandedActions = (action: Action, ancestors = new Array<Action>()) => {
      if (action.diffMode) {
        if (!firstDiffAction) firstDiffAction = action;
        expandedActions.add(...eventIds(action));
        for (const ancestor of ancestors) expandedActions.add(...eventIds(ancestor));
      }
      if (action.children && action.children.length > 0) {
        ancestors.push(action);
        action.children.forEach((child) => markExpandedActions(child, ancestors));
        ancestors.pop();
      }
      return ancestors;
    };

    const shouldExpand = (action: Action) =>
      expandedActions.size === 0 || eventIds(action).some((id) => expandedActions.has(id));

    this.diagram?.rootActions.forEach((root) => markExpandedActions(root));
    expandedActions.delete(undefined);

    this.collapsedActionState = this.actions.map((action) => !shouldExpand(action));

    if (firstDiffAction && this.$store?.state) {
      const eventId = eventIds(firstDiffAction).filter(Boolean)[0];
      const { appMap } = this.$store.state;
      const event = appMap.eventsById[eventId];
      this.$store.commit(SET_FOCUSED_EVENT, event);
    }

    if (!firstDiffAction && this.interactive)
      this.collapseActionsForCompactLook(this.actions, this.collapseDepth);
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
