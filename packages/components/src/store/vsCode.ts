import Vue from 'vue';
import Vuex from 'vuex';
import {
  AppMap,
  buildAppMap,
  AppMapFilter,
  deserializeFilter,
  base64UrlDecode,
  CodeObject,
  Event,
  Filter,
} from '@appland/models';
import toListItem, { FindingListItem, ResolvedFinding } from '@/lib/finding';
import { Diagram, unparseDiagram } from '@appland/sequence-diagram';

Vue.use(Vuex);

export const VIEW_COMPONENT = 'viewComponent';
export const VIEW_SEQUENCE = 'viewSequence';
export const VIEW_FLOW = 'viewFlow';
export const VIEW_FLAMEGRAPH = 'viewFlamegraph';

type ViewType =
  | typeof VIEW_COMPONENT
  | typeof VIEW_SEQUENCE
  | typeof VIEW_FLOW
  | typeof VIEW_FLAMEGRAPH;

export const DEFAULT_VIEW: ViewType = 'viewComponent';
export const DEFAULT_FILTER_NAME = 'AppMap default';

// Always have the AppMap default filter as the top option
function savedFiltersSorter(a: any, b: any) {
  // default filter goes on top
  if (a.default) return -1;
  if (b.default) return 1;

  // AppMap default filter goes next
  if (a.filterName === DEFAULT_FILTER_NAME) return -1;
  if (b.filterName === DEFAULT_FILTER_NAME) return 1;

  return a.filterName.localeCompare(b.filterName);
}

type FQID = string;
type Selectable = FQID | CodeObject | Event | FindingListItem;
type SavedFilter = {
  filterName: string;
  state: string;
  default?: boolean;
};

type SetAppMapDataOptions = {
  appMap: Record<string, unknown>;
  sequenceDiagram?: Diagram;
};

class ResolveResult<T> {
  constructor(readonly fqid: string, readonly object: T) {}

  public get type(): string {
    return this.fqid.split(':')[0];
  }
};

export function buildStore() {
  return new Vuex.Store({
    state: {
      appMap: new AppMap(),
      filteredAppMap: new AppMap(),
      precomputedSequenceDiagram: undefined as Diagram | undefined,
      selectionStack: [] as Selectable[],
      currentSelection: undefined as Selectable | undefined,
      currentView: DEFAULT_VIEW,
      selectedLabel: undefined as string | undefined,
      focusedEvent: undefined as Event | undefined,
      expandedPackages: [] as CodeObject[],
      filters: new AppMapFilter(),
      findings: [] as ResolvedFinding[],
      savedFilters: [] as SavedFilter[],
      selectedSavedFilter: undefined as SavedFilter | undefined,
      defaultFilter: undefined as SavedFilter | undefined,
      highlightedEvents: [] as Event[],
      collapsedActionState: [],
    },

    getters: {
      selectedObject(state) {
        if (state.currentSelection) return state.currentSelection;
        return state.selectionStack[state.selectionStack.length - 1];
      },
      appMap: (state) => state.filteredAppMap,
      resolveObject: (state) => (selection: Selectable, appMap?: AppMap): ResolveResult<Selectable | undefined> => {
        const fqid = typeof selection === 'string' ? selection : selection.fqid;
        if (!fqid) {
          throw new Error('Invalid selection, FQID was undefined');
        };

        const [match, type, object] = fqid.match(/^([a-z\-]+):(.+)/) || [];
        if (!match) {
          throw new Error(`Invalid selection, FQID was malformed: ${fqid}`);
        };

        const scope = appMap || state.filteredAppMap;

        switch (type) {
          case 'event':
          case 'id': {
            const eventId = parseInt(object, 10);

            if (Number.isNaN(eventId)) {
              throw new Error(`Invalid selection, event ID was not a number: ${object}`);
            };

            const event = scope.events.find((e) => e.id === eventId);
            return new ResolveResult(fqid, event);
          }

          case 'analysis-finding': {
            const hash = object;
            const resolvedFinding = state.findings.find(({ finding }) => finding.hash_v2 === hash || finding.hash === hash);
            const obj = resolvedFinding ? toListItem(resolvedFinding) : undefined;
            return new ResolveResult(fqid, obj);
          }

          case 'label': {
            return new ResolveResult(fqid, object);
          }

          default: {
            const obj = scope.classMap.codeObjects.find((obj) => obj.fqid === fqid);
            return new ResolveResult(fqid, obj);
          }
        }
      },
    },

    actions: {
      loadData({ commit }, appMap: Record<string, unknown>, sequenceDiagram?: Diagram) {
        commit('SET_APPMAP_DATA', { appMap, sequenceDiagram });
      },
      selectObject({ commit, state, getters }, obj: Selectable, modifyFilters?: boolean) {
        let res: ResolveResult<Selectable | undefined> = getters.resolveObject(obj);
        if (!res.object && modifyFilters) {
          // Attempt to resolve without filters applied
          res = getters.resolveObject(obj, state.appMap);

          if (res.object) {
            commit('CLEAR_DECLUTTER_FILTERS');
          }

          res = getters.resolveObject(obj);
          if (!res.object) {
            // This should never happen. The object was found in the unfiltered set,
            // filters were cleared, and it's not found again.
            throw new Error(`Unable to resolve object: ${obj}`);
          }
        }

        if (res.type === 'label') {
          commit('SELECT_LABEL', res.object);
        } else {
          commit('SELECT_CODE_OBJECT', res.object);
        }
      },
      clearSelectionStack({ commit }) {
        commit('CLEAR_SELECTION_STACK');
      },
      popSelectionStack({ commit }) {
        commit('POP_SELECTION_STACK');
      },
      focusEvent({ commit }, event: Event) {
        commit('SET_FOCUSED_EVENT', event);
      },
      setView({ commit }, view: ViewType) {
        commit('SET_VIEW', view);
      },
      hideObject({ commit }, fqid: string) {
        commit('ADD_HIDDEN_NAME', fqid);
      },
      removeFilterRootObject({ commit, state }, fqid: string) {
        const index = state.filters.rootObjects.findIndex((rootObject) => rootObject.fqid === fqid);
        if (index === -1) return;

        commit('REMOVE_ROOT_OBJECT', fqid);
      },
      toggleFilterRootObject({ commit, state }, fqid: string) {
        const index = state.filters.rootObjects.findIndex((rootObject) => rootObject.fqid === fqid);
        if (index === -1) {
          commit('ADD_ROOT_OBJECT', fqid);
        } else {
          commit('REMOVE_ROOT_OBJECT', index);
        }
      },
    },

    mutations: {
      // Stores the initial, complete AppMap.
      SET_APPMAP_DATA(state, { appMap, sequenceDiagram }: SetAppMapDataOptions) {
        if (sequenceDiagram) {
          state.precomputedSequenceDiagram = unparseDiagram(sequenceDiagram);
          appMap.sequenceDiagram = state.precomputedSequenceDiagram;
        }

        state.selectionStack = [];
        state.appMap = buildAppMap(appMap).normalize().build();

        // TODO: Is this needed? This looks like view model code
        // state.appMap.callTree.rootEvent.forEach((e) => {
        //   e.displayName = fullyQualifiedFunctionName(e.input);
        // });
      },

      // Show information about a code object in the sidebar.
      // The code object can be a package, class, function, SQL, etc, or it can
      // be a specific event. These code object selections are stored in a stack, so that
      // the user can navigate back to the previous selection.
      SELECT_CODE_OBJECT(state, selection?: Selectable) {
        if (selection typeof 'string') {
          // It's a FQID
          const fqid = obj;
        const [match, type, object] = fqid.match(/^([a-z\-]+):(.+)/) || [];
        if (!match) return;

        if (type === 'label') {
          commit('SELECT_LABEL', object);
          return;
        }

        const { classMap, events } = state.filteredAppMap;
        let selectedObject: Event | CodeObject | undefined;

        if (type === 'event') {
          const eventId = parseInt(object, 10);

          if (Number.isNaN(eventId)) return;

          selectedObject = events.find((e) => e.id === eventId);

          // It's possible that we're trying to select an object that does not exist in the filtered
          // set. If we're unable to find an object, we'll look for it in the unfiltered set.
          if (!selectedObject && modifyFilters) {
            selectedObject = state.appMap.events.find((e) => e.id === eventId);

            // We found it in the unfiltered set. So start turning everything on.
            // TODO: Why everything?
            if (selectedObject) commit('CLEAR_DECLUTTER_FILTERS');
          }
        } else if (type === 'analysis-finding') {
          const hash_v2 = object;
          const finding = state.findings.find(({ finding }) => finding.hash_v2 === hash_v2);
          if (finding) commit('SELECT_CODE_OBJECT', toListItem(finding));
        } else {
          selectedObject = classMap.codeObjects.find((obj) => obj.fqid === fqid);
        }

        if (selectedObject) commit('SELECT_CODE_OBJECT', selectedObject);
        }
        if (selection) {
          let selectionProperty: keyof CodeObject | keyof Event | keyof FindingListItem = 'fqid';
          if ('type' in selection && selection.type === 'analysis-finding') {
            selectionProperty = 'name';
          }

          const existingSelection = state.selectionStack.find((selectedObject) => {
            if (!(selectionProperty in selectedObject)) return false;
            if (!(selectionProperty in selection)) return false;
            return (
              (selectedObject as any)[selectionProperty] === (selection as any)[selectionProperty]
            );
          });

          if (existingSelection) {
            state.currentSelection = existingSelection;
          } else {
            const selectionStack = Array.isArray(selection) ? selection : [selection];
            state.selectionStack.push(...selectionStack);
            state.currentSelection = undefined;
          }
        } else {
          state.selectionStack = [];
          state.currentSelection = undefined;
        }

        state.selectedLabel = undefined;
        state.focusedEvent = undefined;
        state.highlightedEvents = [];
      },

      POP_SELECTION_STACK(state) {
        state.selectionStack.pop();
        state.selectedLabel = undefined;
        state.focusedEvent = undefined;
        state.highlightedEvents = [];
      },

      CLEAR_SELECTION_STACK(state) {
        state.selectionStack = [];
        state.selectedLabel = undefined;
        state.focusedEvent = undefined;
        state.highlightedEvents = [];
        state.currentSelection = undefined;
      },

      SELECT_LABEL(state, label) {
        state.selectionStack = [];
        state.selectedLabel = label;
        state.focusedEvent = undefined;
        state.highlightedEvents = [];
      },

      SET_VIEW(state, view) {
        state.currentView = view;
      },

      // Focused event refers to an event that should be displayed and emphasized in
      // the current events view (sequence diagram or trace view). The viewport should be adjusted
      // so that this event is visible, and an effect can be rendered on the event.
      // This action does not imply that the sidebar display should be changed.
      SET_FOCUSED_EVENT(state, event: Event) {
        state.focusedEvent = event;
      },

      ADD_EXPANDED_PACKAGE(state, packageToAdd: CodeObject) {
        state.expandedPackages.push(packageToAdd);
      },

      REMOVE_EXPANDED_PACKAGE(state, subClass) {
        state.expandedPackages = state.expandedPackages.filter(
          (expandedPackage) => expandedPackage.fqid !== subClass.packageObject.fqid
        );
      },

      SET_EXPANDED_PACKAGES(state, expandedPackages) {
        state.expandedPackages = expandedPackages;
      },

      CLEAR_EXPANDED_PACKAGES(state) {
        state.expandedPackages = [];
      },

      SET_FILTER(state, filter) {
        state.filters = filter;
        state.filteredAppMap = filter.filter(state.appMap, state.findings);
      },

      CLEAR_DECLUTTER_FILTERS(state) {
        Object.values(state.filters.declutter).forEach(
          (declutterProperty: Filter.DeclutterProperty) => {
            declutterProperty.on = false;
          }
        );
        state.filteredAppMap = state.filters.filter(state.appMap, state.findings);
      },

      SET_ELAPSED_TIME(state, elapsedTime: number) {
        state.filters.declutter.hideElapsedTimeUnder.time = elapsedTime;
      },

      RESET_FILTERS(state) {
        let newDefault;
        const defaultFilter = state.savedFilters.find((savedFilter) => savedFilter.default);

        if (defaultFilter) {
          const filterStateString = base64UrlDecode(defaultFilter.state);
          const parsedState = JSON.parse(filterStateString);

          newDefault = deserializeFilter(parsedState.filters);
          state.selectedSavedFilter = defaultFilter;
        } else {
          newDefault = new AppMapFilter();
        }

        state.filters = newDefault;
      },

      ADD_ROOT_OBJECT(state, fqid) {
        const objectFqid = fqid.trim();

        if (!objectFqid || state.filters.rootObjects.includes(objectFqid)) return;

        state.filters.rootObjects.push(objectFqid);
      },

      REMOVE_ROOT_OBJECT(state, index: number) {
        state.filters.rootObjects.splice(index, 1);
      },

      ADD_HIDDEN_NAME(state, nameToRemove) {
        const objectName = nameToRemove.trim();
        if (!objectName || state.filters.declutter.hideName.names.includes(objectName)) return;

        state.filters.declutter.hideName.names.push(objectName);
        state.filters.declutter.hideName.on = true;
      },

      REMOVE_HIDDEN_NAME(state, index) {
        state.filters.declutter.hideName.names.splice(index, 1);
      },

      SET_SAVED_FILTERS(state, savedFilters) {
        state.savedFilters = savedFilters;
        state.savedFilters.sort(savedFiltersSorter);

        const selectedSavedFilter = state.selectedSavedFilter;
        if (selectedSavedFilter) {
          const newselectedSavedFilter = state.savedFilters.find(
            (savedFilter) => savedFilter.filterName === selectedSavedFilter.filterName
          );
          if (newselectedSavedFilter) state.selectedSavedFilter = newselectedSavedFilter;
        }
      },

      SET_SELECTED_SAVED_FILTER(state, selectedSavedFilter) {
        state.selectedSavedFilter = selectedSavedFilter;
      },

      SET_HIGHLIGHTED_EVENTS(state, highlightedEvents: Event[]) {
        state.highlightedEvents = highlightedEvents;
      },

      SET_COLLAPSED_ACTION_STATE(state, collapsedActionState) {
        state.collapsedActionState = collapsedActionState;
      },
    },
  });
}

export const store = buildStore();
