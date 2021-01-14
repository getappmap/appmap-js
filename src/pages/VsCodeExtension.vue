<template>
  <div id="app">
    <div class="main-column main-column--left">
      <v-details-panel :selected-object="selectedObject">
        <template v-slot:buttons>
          <v-details-button
            icon="clear"
            v-if="selectedObject"
            @click.native="clearSelection"
          >
            Clear selection
          </v-details-button>
          <v-details-button icon="back" v-if="canGoBack" @click.native="goBack">
            Back to
            <b v-if="prevSelectedObject && prevSelectedObject.name">
              {{ prevSelectedObject.name }}
            </b>
            <span v-else>previous</span>
          </v-details-button>
        </template>
      </v-details-panel>
    </div>

<<<<<<< HEAD
    <div class="main-column main-column--right">
=======
    <div class="column column--right">
      <div class="search-wrap">
        <div id="search">
          <h3 class="block-heading">Filters</h3>
          <div id="filter-input">
            <input
              type="text"
              size="80"
              placeholder="Filter the diagram by package, class or function"
              autocomplete="off"
            />
          </div>
        </div>
        <div id="search-results">
          <ul>
            <li>user::name</li>
            <li>filter::name</li>
            <li>lorem::ipsum</li>
          </ul>
        </div>
      </div>

>>>>>>> 0432507... Styling and filtering placeholder
      <v-tabs @activateTab="onChangeTab" ref="tabs">
        <v-tab
          name="Dependency Map"
          :is-active="isViewingComponent"
          :ref="VIEW_COMPONENT"
        >
          <v-diagram-component
            ref="componentDiagram"
            :component-data="components"
          />
        </v-tab>

        <v-tab name="Trace" :is-active="isViewingFlow" :ref="VIEW_FLOW">
          <v-diagram-flow ref="diagramFlow" :call-tree="callTree" />
        </v-tab>
      </v-tabs>
    </div>
  </div>
</template>

<script>
import { Event } from '@/lib/models';
import VDetailsPanel from '../components/DetailsPanel.vue';
import VDetailsButton from '../components/DetailsButton.vue';
import VDiagramComponent from '../components/DiagramComponent.vue';
import VDiagramFlow from '../components/DiagramFlow.vue';
import VTabs from '../components/Tabs.vue';
import VTab from '../components/Tab.vue';
import {
  store,
  SET_APPMAP_DATA,
  SET_VIEW,
  VIEW_COMPONENT,
  VIEW_FLOW,
  POP_OBJECT_STACK,
  CLEAR_OBJECT_STACK,
} from '../store/vsCode';

export default {
  name: 'VSCodeExtension',

  components: {
    VDetailsPanel,
    VDetailsButton,
    VDiagramComponent,
    VDiagramFlow,
    VTabs,
    VTab,
  },

  store,

  data() {
    return {
      VIEW_COMPONENT,
      VIEW_FLOW,
    };
  },

  watch: {
    '$store.state.currentView': {
      handler(view) {
        this.onChangeTab(this.$refs[view]);
        this.$refs.tabs.activateTab(this.$refs[view]);
      },
    },
    '$store.getters.selectedObject': {
      handler(selectedObject) {
        if (selectedObject && !(selectedObject instanceof Event)) {
          this.setView(VIEW_COMPONENT);
        }
      },
    },
  },

  computed: {
    selectedObject() {
      return this.$store.getters.selectedObject;
    },

    components() {
      return this.$store.state.appMap.components;
    },

    callTree() {
      return this.$store.state.appMap.callTree;
    },

    isViewingComponent() {
      return this.$store.state.currentView === VIEW_COMPONENT;
    },

    isViewingFlow() {
      return this.$store.state.currentView === VIEW_FLOW;
    },

    prevSelectedObject() {
      return this.$store.getters.prevSelectedObject;
    },

    canGoBack() {
      return this.$store.getters.canPopStack;
    },
  },

  methods: {
    loadData(data) {
      this.$store.commit(SET_APPMAP_DATA, data);
    },

    onChangeTab(tab) {
      // tabs are referenced by their view key
      const index = Object.values(this.$refs).findIndex((ref) => ref === tab);
      if (index === -1) {
        // There's no ref set up for this tab
        return;
      }

      this.setView(Object.keys(this.$refs)[index]);
    },

    setView(view) {
      this.$store.commit(SET_VIEW, view);
    },

    clearSelection() {
      this.$store.commit(CLEAR_OBJECT_STACK);
    },

    goBack() {
      this.$store.commit(POP_OBJECT_STACK);
    },
  },
};
</script>

<style lang="scss">
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
}

* {
  box-sizing: border-box;
}

code {
  color: $teal;
}

#app {
  display: grid;
  grid-template-columns: 25% auto;
  grid-template-rows: max(1fr, 100%);
  height: 100vh;
  color: $base11;

  .main-column {
    overflow-y: scroll;

    &--left {
      grid-column: 1;
      width: 100%;
      background-color: $vs-code-gray1;
      height: 100vh;
    }

    &--right {
      grid-column-start: 2;
      grid-column-end: 3;
      width: 100%;
      min-width: 250px;
      word-break: break-all;
      overflow: hidden;
      display: grid;
      grid-template-rows: auto 1fr;
    }
  }

  //Search
  .search-wrap {
    background-color: $vs-code-gray1;
    font-family: sans-serif;
    color: $base03;
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    transition: $transition;
    display: flex;
    flex-direction: column;
  }
  #search {
    padding: 1.5rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    h3 {
      color: $base03;
      font-weight: 500;
      letter-spacing: 0.5px;
      margin: 0;
    }
  }
  #filter-input {
    width: 90%;
    input {
      font-size: 0.9rem;
      letter-spacing: 0.5px;
      width: 100%;
    }
  }
  #search-results {
    background-color: var(--vs-code-gray1);
    //margin-bottom: 1rem;
    ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
      li {
        color: var(--base11);
        border-bottom: 1px solid var(--base15);
        padding: 0.5rem 2rem;
        transition: $transition;
        &:hover {
          background-color: $blue;
          color: $base03;
          border-color: $blue;
          cursor: pointer;
        }
        &:first-of-type {
          border-top: 1px solid var(--base15);
        }
        &:last-of-type {
          border-bottom: 1px solid var(--vs-code-gray2);
        }
      }
    }
  }
}
</style>
