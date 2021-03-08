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

  data() {
    return {
      changes: [],
    };
  },

  computed: {
    baseAppMap() {
      return buildAppMap(this.base).normalize().build();
    },

    workingAppMap() {
      return buildAppMap(this.working).normalize().build();
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
    setBaseEvent(e) {
      const { base } = this.$refs;
      base.selectedEvent = e;
      base.focusHighlighted();
    },
    setWorkingEvent(e) {
      const { working } = this.$refs;
      working.selectedEvent = e;
      working.focusHighlighted();
    },
    highlight(kind, data) {
      if (kind === 'changed') {
        const [eventBase, eventWorking] = data;
        this.setBaseEvent(eventBase);
        this.setWorkingEvent(eventWorking);
      } else if (kind === 'removed') {
        this.setBaseEvent(data);
        this.setWorkingEvent(null);
      } else if (kind === 'added') {
        this.setBaseEvent(null);
        this.setWorkingEvent(data);
      }
    },
  },

  // #region For testing purposes only
  mounted() {
    const diff = AppMap.getDiff(this.baseAppMap, this.workingAppMap);
    diff.added.forEach((e) => this.changes.push(['added', e]));
    diff.removed.forEach((e) => this.changes.push(['removed', e]));
    diff.changed.forEach((events) => this.changes.push(['changed', events]));

    console.log('changes:');
    console.log(diff);

    let i = 0;
    const highlightChange = () => {
      if (!this.changes.length) {
        return;
      }
      const [kind, data] = this.changes[i];
      console.log(kind, data);
      this.highlight(kind, data);
    };
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        i = (i + 1) % this.changes.length;
        highlightChange();
      }
    });
    highlightChange();
  },
  // #endregion
};
</script>

<style lang="scss">
@import '@/scss/diagrams/style';
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
