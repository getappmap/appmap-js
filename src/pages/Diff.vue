<template>
  <div class="diff">
    <div class="diff__column">
      <v-diagram-trace
        ref="base"
        :events="getRootEvents(baseAppMap)"
        :selectedEvents="eventsBase"
        :highlightColor="highlightColor"
        :zoomControls="false"
        @clickEvent="(e) => log(e.hash)"
      />
      <!-- <v-overlay
        @mousedown.native="hideOverlay = true"
        v-if="eventsBase === null && !hideOverlay"
        :opacity="0"
      /> -->
    </div>

    <div class="diff__column">
      <v-diagram-trace
        ref="working"
        :events="getRootEvents(workingAppMap)"
        :selectedEvents="eventsWorking"
        :highlightColor="highlightColor"
        :zoomControls="false"
        @clickEvent="(e) => log(e.hash)"
      />
      <!-- <v-overlay
        @mousedown.native="hideOverlay = true"
        v-if="eventsWorking === null && !hideOverlay"
        :opacity="0"
      /> -->
    </div>
  </div>
</template>

<script>
import { buildAppMap, AppMap } from '@/lib/models';
import VDiagramTrace from '@/components/DiagramTrace.vue';
import VOverlay from '@/components/Overlay.vue';

const HIGHLIGHT_COLORS = {
  added: '#a6e22e',
  removed: '#cd1414',
  changed: '#ead656',
};

export default {
  name: 'VSCodeExtension',

  components: {
    VDiagramTrace,
    VOverlay,
  },

  props: {
    base: [String, Object],
    working: [String, Object],
  },

  data() {
    return {
      allChanges: [],
      changeType: null,
      eventsBase: [],
      eventsWorking: [],
      hideOverlay: false,
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
      console.log(...msg);
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
      this.hideOverlay = false;

      if (kind === 'changed') {
        const [eventsBase, eventsWorking] = data;
        this.eventsBase = eventsBase;
        this.eventsWorking = eventsWorking;
      } else if (kind === 'removed') {
        this.eventsWorking = [];
        this.eventsBase = data;
      } else if (kind === 'added') {
        this.eventsWorking = data;
        this.eventsBase = [];
      }
    },
  },

  // #region For testing purposes only
  mounted() {
    const diff = AppMap.getDiff(this.baseAppMap, this.workingAppMap);
    const allChanges = [];

    // ( change type, event, 0..1 position in appmap )
    diff.added.forEach((e) =>
      allChanges.push(['added', e, e.id / this.baseAppMap.events.length])
    );
    diff.removed.forEach((e) =>
      allChanges.push(['removed', e, e.id / this.baseAppMap.events.length])
    );
    diff.changed.forEach((events) =>
      allChanges.push([
        'changed',
        events,
        events[0].id / this.baseAppMap.events.length,
      ])
    );

    this.allChanges = allChanges.sort((a, b) => a[2] - b[2]);

    console.log('changes:', diff);

    let i = 0;
    const highlightChange = () => {
      if (!this.allChanges.length) {
        return;
      }
      const [kind, data] = this.allChanges[i];
      console.log(kind, data);
      this.highlight(kind, data);
    };
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        i = (i + 1) % this.allChanges.length;
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

.diff {
  display: grid;
  grid-template-columns: 50%;
  grid-template-rows: max(1fr, 100%);
  height: 100vh;
  color: $base11;
  background-color: $vs-code-gray1;

  &__column {
    position: relative;
    overflow-y: scroll;
    width: 100%;
    grid-row: 1;
    border-style: solid;
    border-color: $gray1;
    border-width: 0 2px;
  }
}
</style>
