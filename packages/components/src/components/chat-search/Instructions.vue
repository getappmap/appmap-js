<template>
  <div class="instructions">
    <div class="instructions__container">
      <div class="instructions__alerts">
        <v-alert-box v-if="!appmapYmlPresent" level="error" data-cy="alert-no-config">
          <div class="instructions__stats__header">
            No AppMap configuration is present in this workspace.
          </div>
          <div class="instructions__stats__sub-header">
            <p>
              This typically means that the recording agent is not installed or has not yet been run
              for the first time.
            </p>
            <p class="mb-0">
              To resolve this,
              <a href="#" data-cy="install-guide" @click.prevent="openInstallInstructions">
                refer to the instructions in the installation guide.
              </a>
            </p>
          </div>
        </v-alert-box>

        <v-alert-box
          v-if="appmapStats && appmapStats.numAppMaps"
          level="info"
          data-cy="alert-success"
        >
          <div class="instructions__stats__header">
            There are {{ appmapStats.numAppMaps }} AppMap recordings in this workspace.
          </div>
          <div class="instructions__stats__sub-header">
            From these recordings, AppMap has observed:
          </div>
          <div class="instructions__stats__details" data-cy="stats">
            <div class="instructions__stats__details-row">
              <div class="stats-number">
                <strong>{{ appmapStats.packages.length }}</strong>
              </div>
              packages
            </div>
            <div class="instructions__stats__details-row">
              <div class="stats-number">
                <strong>{{ appmapStats.classes.length }}</strong>
              </div>
              classes
            </div>
            <div class="instructions__stats__details-row" v-if="appmapStats.routes.length">
              <div class="stats-number">
                <strong>{{ appmapStats.routes.length }}</strong>
              </div>
              distinct HTTP routes
            </div>
            <div class="instructions__stats__details-row" v-if="appmapStats.tables.length">
              <div class="stats-number">
                <strong>{{ appmapStats.tables.length }}</strong>
              </div>
              distinct SQL tables
            </div>
          </div>
          <div>
            Navie improves with every runtime recording. To learn more about the different recording
            methods available, refer to the
            <a href="#" @click.prevent="openRecordInstructions" data-cy="record-guide">
              recording guide.
            </a>
          </div>
        </v-alert-box>

        <v-alert-box v-else-if="appmapYmlPresent" level="warning" data-cy="alert-no-data">
          <div class="instructions__stats__header">
            No AppMap recordings were found in this workspace.
          </div>
          <div class="instructions__stats__sub-header">
            To resolve this,
            <a href="#" @click.prevent="openRecordInstructions" data-cy="record-guide">
              refer to the instructions in the recording guide.
            </a>
          </div>
        </v-alert-box>
      </div>

      <div class="instructions__appmaps">
        <h2>Most recent AppMap recordings</h2>
        <p>
          When you run your application with the AppMap recording agent enabled, recordings will
          automatically be captured as you make HTTP requests, run tests, or execute AppMap
          recording code blocks.
        </p>
        <p class="mb-0">
          Each recording can individually be viewed as a <b>sequence diagram</b>,
          <b>component diagram</b>, <b>flame graph</b>, and more. When talking to Navie, these same
          recordings will be used to provide you with the most accurate and relevant information.
        </p>
      </div>

      <div class="instructions__appmap-list" v-if="appmaps && appmaps.length">
        <v-appmap-list-item
          v-for="appmap in appmaps"
          :key="appmap.path"
          :name="appmap.name"
          :recording-method="appmap.recordingMethod"
          :created-at="appmap.createdAt"
          :path="appmap.path"
          data-cy="appmap-list-item"
        />
      </div>

      <template>
        <div v-if="appmaps && appmaps.length">
          All recordings are also located in the
          <a href="#" @click.prevent="showAppMapTree">AppMap sidebar panel.</a>
        </div>
        <div v-else>You do not yet have any AppMap recordings.</div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import Vue, { PropType } from 'vue';
import VAppmapListItem from '@/components/AppmapListItem.vue';
import VAlertBox from '@/components/AlertBox.vue';

type AppmapStats = {
  numAppMaps: number;
  packages: string[];
  classes: string[];
  routes: string[];
  tables: string[];
  appmaps: any[];
};

type AppMapMetadata = {
  recordingMethod: string;
  name: string;
  createdAt: string;
  path: string;
};

export default Vue.extend({
  name: 'v-instructions',

  components: {
    VAppmapListItem,
    VAlertBox,
  },

  props: {
    appmapStats: Object as PropType<AppmapStats>,
    appmapYmlPresent: Boolean as PropType<boolean>,
    appmaps: Array as PropType<AppMapMetadata[]>,
  },

  methods: {
    openInstallInstructions(): void {
      this.$root.$emit('open-install-instructions');
    },
    openRecordInstructions(): void {
      this.$root.$emit('open-record-instructions');
    },
    showAppMapTree(): void {
      this.$root.$emit('show-appmap-tree');
    },
    openAppMap(path: string): void {
      this.$root.$emit('open-appmap', path);
    },
  },
});
</script>

<style lang="scss" scoped>
.instructions {
  font-size: 0.9rem;
  color: $white;
  background-color: $gray1;
  max-height: 100%;
  overflow-y: auto;
  padding: 1rem 0;

  .mb-0 {
    margin-bottom: 0;
  }

  a {
    text-decoration: none;
    color: $lightblue;

    &:hover {
      color: $blue;
      transition: $transition;
      cursor: pointer;
    }
  }

  &__alerts {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__appmap-list {
    display: flex;
    flex-direction: column;
    border-radius: $border-radius;
    // min-height: 1rem;
    // overflow: hidden;

    & > :nth-child(odd) {
      background-color: rgba(128, 128, 255, 0.1);
    }
    & > * {
      border-bottom: 1px solid $gray2;
    }
    & > *:last-child {
      border-bottom: none;
    }
  }

  &__stats {
    background-color: #181c28;
    padding: 1.75rem;

    h2 {
      margin-bottom: 1.25rem;
      margin-top: 0;
    }

    &__header {
      margin-bottom: 1.25rem;
      font-weight: 600;
    }

    &__sub-header {
      .divider {
        margin: 0 0.75rem;
      }
    }

    &__details {
      width: fit-content;
      padding: 1rem 0;

      &-row {
        display: flex;
        padding: 0.2rem 12rem 0.2rem 0.75rem;

        .stats-number {
          width: 30px;
        }

        &:nth-child(odd) {
          background-color: rgba(128, 128, 255, 0.1);
        }
      }
    }

    &__visualizations-info {
      margin-top: 1.5rem;
    }
  }

  &__container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    min-width: 0;
    max-width: 64rem;
    margin: 0 auto;
    height: 100%;

    h2 {
      margin-top: 0;
    }

    h3 {
      font-size: 1.1rem;
      margin-top: 2.5rem;
    }
  }
}
</style>
