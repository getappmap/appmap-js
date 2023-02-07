<template>
  <div class="diff">
    <div class="diff__column">
      <v-diagram-trace
        ref="base"
        :events="eventsBase"
        :selectedEvents="selectedEventsBase"
        :highlightColor="highlightConfig.color"
        :highlightStyle="highlightConfig.style"
        :zoomControls="false"
        :highlightAll="changeType !== 'changed'"
      />

      <div class="diff__filters">
        <v-popper-menu position="bottom right" :showDot="filtersChanged">
          <template v-slot:icon>
            <v-cog />
          </template>
          <template v-slot:body>
            <h2>Filters</h2>
            <div>
              <input type="checkbox" id="unlabeled-events" v-model="filters.unlabeled.on" />
              <label for="unlabeled-events">Unlabeled events</label>
            </div>

            <div>
              <input type="checkbox" id="labeled-events" v-model="filters.labeled.on" />
              <label for="labeled-events">Labeled events</label>
            </div>

            <div>
              <input type="checkbox" id="http-server-requests" v-model="filters.http.on" />
              <label for="http-server-requests">HTTP server requests</label>
            </div>

            <div>
              <input type="checkbox" id="sql-queries" v-model="filters.sql.on" />
              <label for="sql-queries">SQL queries</label>
            </div>
          </template>
        </v-popper-menu>
      </div>
    </div>

    <div class="diff__column">
      <v-diagram-trace
        ref="working"
        :events="eventsWorking"
        :selectedEvents="selectedEventsWorking"
        :highlightColor="highlightConfig.color"
        :highlightStyle="highlightConfig.style"
        :zoomControls="false"
        :highlightAll="changeType !== 'changed'"
      />
    </div>
  </div>
</template>

<script>
import { buildAppMap, AppMap, getRootEvents } from '@appland/models';
import VDiagramTrace from '@/components/DiagramTrace.vue';
import VPopperMenu from '@/components/PopperMenu.vue';
import VCog from '@/assets/cog-solid.svg';

const HIGHLIGHT_CONFIG = {
  added: {
    color: '#a6e22e',
    style: 'solid',
  },
  removed: {
    color: '#cd1414',
    style: 'solid',
  },
  changed: {
    color: '#ead656',
    style: 'dashed',
  },
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

    highlightConfig() {
      return HIGHLIGHT_CONFIG[this.changeType] || {};
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
        events: this.workingAppMap.data.events.filter((e) => this.filterEvent(e)),
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

    filtersChanged() {
      return Object.values(this.filters).some(
        (f) =>
          (typeof f.on === 'boolean' && f.on === false) ||
          (typeof on === 'function' && f.on() === false)
      );
    },

    allChanges() {
      const diff = AppMap.getDiff(this.filteredBaseAppMap, this.filteredWorkingAppMap);
      const changes = [];

      // ( change type, event, 0..1 position in appmap )
      diff.added.forEach((e) =>
        changes.push(['added', e, e[0].id / this.baseAppMap.events.length])
      );
      diff.removed.forEach((e) =>
        changes.push(['removed', e, e[0].id / this.baseAppMap.events.length])
      );
      diff.changed.forEach((events) =>
        changes.push(['changed', events, events[0].id / this.baseAppMap.events.length])
      );

      return changes.sort((a, b) => a[2] - b[2]);
    },
  },

  methods: {
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

<style scoped lang="scss">
@import '~@appland/diagrams/dist/style.css';
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

  &__filters {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
  }
}
</style>
