<template>
  <div id="app">
    <div class="diff-column">
      <v-diagram-trace
        ref="base"
        :events="getRootEvents(baseAppMap)"
        @clickEvent="onBaseChangeEvent"
      />
    </div>

    <div class="diff-column">
      <v-diagram-trace
        ref="working"
        :events="getRootEvents(workingAppMap)"
        @clickEvent="onWorkingChangeEvent"
      />
    </div>
  </div>
</template>

<script>
import { buildAppMap, AppMap } from '@/lib/models';
import VDiagramTrace from '../components/DiagramTrace.vue';

export default {
  name: 'VSCodeExtension',

  components: {
    VDiagramTrace,
  },

  props: {
    base: [String, Object],
    working: [String, Object],
  },

  computed: {
    baseAppMap() {
      return buildAppMap(this.base).normalize().build();
    },

    workingAppMap() {
      return buildAppMap(this.working).normalize().build();
    },

    changes() {
      return AppMap.getDiff(this.baseAppMap, this.workingAppMap);
    },
  },

  methods: {
    getRootEvents(appMap) {
      let events = appMap.events.filter(
        (e) => e.isCall() && e.httpServerRequest
      );
      if (events.length === 0) {
        events = appMap.events.filter((e) => e.isCall() && !e.parent);
      }
      return events;
    },
    onBaseChangeEvent(event) {
      const { id } = event;
      const workingEvent = this.workingAppMap.events.find((e) => e.id === id);
      if (workingEvent) {
        this.$refs.working.selectedEvent = workingEvent;
        this.$refs.working.focusHighlighted();
      }
    },
    onWorkingChangeEvent(event) {
      const { id } = event;
      const base = this.baseAppMap.events.find((e) => e.id === id);
      if (base) {
        this.$refs.base.selectedEvent = base;
        this.$refs.base.focusHighlighted();
      }
    },
  },

  mounted() {
    console.log('changes:');
    console.log(this.changes);
  },
};
</script>

<style scoped lang="scss">
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
  grid-template-columns: 50%;
  grid-template-rows: max(1fr, 100%);
  height: 100vh;
  color: $base11;
  background-color: $vs-code-gray1;

  .diff-column {
    overflow-y: scroll;
    width: 100%;
    grid-row: 1;
    border-style: solid;
    border-color: $gray1;
    border-width: 0 2px;
  }
}
</style>
