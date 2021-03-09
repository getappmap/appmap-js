<template>
  <div id="app">
    <div class="diff-column">
      <v-diagram-trace
        ref="base"
        :events="getRootEvents(baseAppMap)"
        :selectedEvent="eventBase"
        :highlightColor="highlightColor"
        @clickEvent="(e) => log(e)"
      />
    </div>

    <div class="diff-column">
      <v-diagram-trace
        ref="working"
        :events="getRootEvents(workingAppMap)"
        :selectedEvent="eventWorking"
        :highlightColor="highlightColor"
        @clickEvent="(e) => log(e)"
      />
    </div>
  </div>
</template>

<script>
import { buildAppMap, AppMap } from '@/lib/models';
import VDiagramTrace from '../components/DiagramTrace.vue';

const HIGHLIGHT_COLORS = {
  added: '#a6e22e',
  removed: '#cd1414',
  changed: '#ead656',
};

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
      diff: {
        added: [],
        changed: [],
        removed: [],
      },
      changes: [],
      changeType: null,
      eventBase: null,
      workingEvent: null,
    };
  },

  computed: {
    baseAppMap() {
      return buildAppMap(this.base).normalize().build();
    },

    workingAppMap() {
      return buildAppMap(this.working).normalize().build();
    },

    highlightColor() {
      return HIGHLIGHT_COLORS[this.changeType];
    },
  },

  methods: {
    log(...msg) {
      window.console.log(...msg);
    },
    getSubtractionOffset(eventId) {
      return this.diff.removed.reduce((sum, e) => {
        if (e.id <= eventId) {
          sum += 1; // eslint-disable-line no-param-reassign
        }

        if (e.returnEvent.id <= eventId) {
          sum += 1; // eslint-disable-line no-param-reassign
        }

        return sum;
      }, 0);
    },
    getAdditionOffset(eventId) {
      return this.diff.added.reduce((sum, e) => {
        if (e.id <= eventId) {
          sum += 1; // eslint-disable-line no-param-reassign
        }

        if (e.returnEvent.id <= eventId) {
          sum += 1; // eslint-disable-line no-param-reassign
        }

        return sum;
      }, 0);
    },
    getRootEvents(appMap) {
      let events = appMap.events.filter(
        (e) => e.isCall() && e.httpServerRequest
      );
      if (events.length === 0) {
        events = appMap.events.filter((e) => e.isCall() && !e.parent);
      }
      return events;
    },
    highlight(kind, data) {
      this.changeType = kind;
      if (kind === 'changed') {
        const [eventBase, eventWorking] = data;
        this.eventBase = eventBase;
        this.eventWorking = eventWorking;
      } else if (kind === 'removed') {
        let eventId = data.id - this.getSubtractionOffset(data.id);
        eventId += this.getAdditionOffset(eventId);
        eventId = Math.max(eventId, 1);
        eventId -= 1;
        const eventWorking = this.workingAppMap.events[eventId];
        this.eventWorking = eventWorking;
        this.eventBase = data;
      } else if (kind === 'added') {
        let eventId = data.id - this.getAdditionOffset(data.id);
        eventId += this.getSubtractionOffset(eventId);

        const lastIndex = this.workingAppMap.events.length - 1;
        let lastEvent = this.workingAppMap.events[lastIndex];
        while (lastEvent && lastEvent.type === 'return') {
          lastEvent = lastEvent.previous;
        }

        eventId = Math.min(Math.max(eventId, 1), lastEvent.id);
        eventId -= 1;

        const eventBase = this.workingAppMap.events[eventId];
        this.eventBase = eventBase;
        this.eventWorking = data;
      }
    },
  },

  // #region For testing purposes only
  mounted() {
    this.diff = AppMap.getDiff(this.baseAppMap, this.workingAppMap);
    this.diff.added.forEach((e) => this.changes.push(['added', e]));
    this.diff.removed.forEach((e) => this.changes.push(['removed', e]));
    this.diff.changed.forEach((events) =>
      this.changes.push(['changed', events])
    );

    console.log('changes:');
    console.log(this.diff);

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

<style scoped lang="scss">
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
