<template>
  <div class="diff">
    <div class="diff__column">
      <v-diagram-trace
        ref="base"
        :events="eventsBase"
        :selectedEvents="selectedEventsBase"
        :highlightColor="highlightColor"
        :zoomControls="false"
        :highlightAll="changeType !== 'changed'"
        @clickEvent="(e) => log(e.hash)"
      />

      <v-popper-menu>
        <template v-slot:icon>
          <v-cog />
        </template>
        <template v-slot:body>
          <h2>Filters</h2>
          <div>
            <input
              type="checkbox"
              id="unlabeled-events"
              v-model="filters.unlabeled.on"
            />
            <label for="unlabeled-events">Unlabeled events</label>
          </div>

          <div>
            <input
              type="checkbox"
              id="unlabeled-events"
              v-model="filters.labeled.on"
            />
            <label for="unlabeled-events">Labeled events</label>
          </div>

          <div>
            <input
              type="checkbox"
              id="unlabeled-events"
              v-model="filters.http.on"
            />
            <label for="unlabeled-events">HTTP server requests</label>
          </div>

          <div>
            <input
              type="checkbox"
              id="unlabeled-events"
              v-model="filters.sql.on"
            />
            <label for="unlabeled-events">SQL queries</label>
          </div>
        </template>
      </v-popper-menu>
      <!-- <v-overlay
        @mousedown.native="hideOverlay = true"
        v-if="eventsBase === null && !hideOverlay"
        :opacity="0"
      /> -->
    </div>

    <div class="diff__column">
      <v-diagram-trace
        ref="working"
        :events="eventsWorking"
        :selectedEvents="selectedEventsWorking"
        :highlightColor="highlightColor"
        :zoomControls="false"
        :highlightAll="changeType !== 'changed'"
        @clickEvent="(e) => log(this.filterEvent(e))"
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
import { getRootEvents } from '@/lib/models/util';
import VDiagramTrace from '@/components/DiagramTrace.vue';
import VPopperMenu from '@/components/PopperMenu.vue';
import VCog from '@/assets/cog-solid.svg';

const HIGHLIGHT_COLORS = {
  added: '#a6e22e',
  removed: '#cd1414',
  changed: '#ead656',
};

export default {
  name: 'v-diff',

  components: {
    VDiagramTrace,
    VPopperMenu,
    VCog,
  },

  props: {
    base: [String, Object],
    working: [String, Object],
  },

  watch: {
    allChanges: {
      handler(changes) {
        const { base, working } = this.$refs;

        base.clearTransform();
        base.focusSelector('.trace-node');
        working.clearTransform();
        working.focusSelector('.trace-node');

        if (changes.length) {
          const [kind, data] = changes[0];
          this.highlight(kind, data);
        }
      },
    },
  },

  data() {
    return {
      changeType: null,
      hideOverlay: false,
      displayUnlabeledEvents: true,
      selectedEventsBase: [],
      selectedEventsWorking: [],
      renderKey: 0,
      filters: {
        unlabeled: {
          on: true,
          filter: (e) => !e.sql && !e.httpServerRequest && e.labels.size === 0,
        },
        labeled: {
          on: true,
          filter: (e) => e.labels.size > 0,
        },
        sql: {
          on: true,
          filter: (e) => Boolean(e.sql),
        },
        http: {
          on: true,
          filter: (e) => Boolean(e.httpServerRequest),
        },
      },
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

    filteredBaseAppMap() {
      return buildAppMap({
        events: this.baseAppMap.data.events.filter((e) => this.filterEvent(e)),
        classMap: this.baseAppMap.classMap.codeObjects.map((c) => c.data),
        metadata: this.baseAppMap.metadata,
      }).build();
    },

    filteredWorkingAppMap() {
      return buildAppMap({
        events: this.workingAppMap.data.events.filter((e) =>
          this.filterEvent(e)
        ),
        classMap: this.workingAppMap.classMap.codeObjects.map((c) => c.data),
        metadata: this.workingAppMap.metadata,
      }).build();
    },

    eventsBase() {
      return getRootEvents(this.filteredBaseAppMap.events);
    },

    eventsWorking() {
      return getRootEvents(this.filteredWorkingAppMap.events);
    },

    filterFuncs() {
      return Object.values(this.filters)
        .filter((f) => {
          const { on } = f;

          if (typeof on === 'boolean') {
            return on;
          }

          if (typeof on === 'function') {
            return on();
          }

          return false;
        })
        .map((f) => f.filter);
    },

    allChanges() {
      const diff = AppMap.getDiff(
        this.filteredBaseAppMap,
        this.filteredWorkingAppMap
      );
      const changes = [];

      // ( change type, event, 0..1 position in appmap )
      diff.added.forEach((e) =>
        changes.push(['added', e, e[0].id / this.baseAppMap.events.length])
      );
      diff.removed.forEach((e) =>
        changes.push(['removed', e, e[0].id / this.baseAppMap.events.length])
      );
      diff.changed.forEach((events) =>
        changes.push([
          'changed',
          events,
          events[0].id / this.baseAppMap.events.length,
        ])
      );

      return changes.sort((a, b) => a[2] - b[2]);
    },
  },

  methods: {
    log(...msg) {
      console.log(...msg);
    },

    highlight(kind, data) {
      this.changeType = kind;
      this.hideOverlay = false;

      if (kind === 'changed') {
        const [eventsBase, eventsWorking] = data;
        this.selectedEventsBase = [eventsBase];
        this.selectedEventsWorking = [eventsWorking];
      } else if (kind === 'removed') {
        this.selectedEventsWorking = [];
        this.selectedEventsBase = data;
      } else if (kind === 'added') {
        this.selectedEventsWorking = data;
        this.selectedEventsBase = [];
      }
    },

    filterEvent(e) {
      return Boolean(this.filterFuncs.find((f) => f(e)));
    },
  },

  // #region For testing purposes only
  mounted() {
    console.log('changes:', this.allChanges);

    let i = 0;
    const highlightChange = () => {
      if (!this.allChanges.length) {
        return;
      }

      const [kind, data] = this.allChanges[i];
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
