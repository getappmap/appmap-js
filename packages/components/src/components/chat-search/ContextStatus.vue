<template>
  <v-alert-box v-if="!appmapYmlPresent" level="error" data-cy="alert-no-config">
    <div class="instructions__stats__header">
      No AppMap configuration is present in this workspace.
    </div>
    <div class="instructions__stats__sub-header">
      <p>
        This typically means that the recording agent is not installed or has not yet been run for
        the first time.
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
    v-else-if="appmapStats && appmapStats.numAppMaps"
    level="info"
    data-cy="alert-success"
  >
    <div class="instructions__stats__header">
      There are {{ appmapStats.numAppMaps }} AppMap recordings in this workspace.
    </div>
    <div class="instructions__stats__sub-header">From these recordings, AppMap has observed:</div>
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
</template>

<script lang="ts">
// @ts-nocheck
import Vue, { PropType } from 'vue';
import VAlertBox from '@/components/AlertBox.vue';

type AppmapStats = {
  numAppMaps: number;
  packages: string[];
  classes: string[];
  routes: string[];
  tables: string[];
  appmaps: any[];
};

export default Vue.extend({
  name: 'v-context-status',

  components: {
    VAlertBox,
  },

  props: {
    appmapStats: Object as PropType<AppmapStats>,
    appmapYmlPresent: Boolean as PropType<boolean>,
  },

  methods: {
    openInstallInstructions(): void {
      this.$root.$emit('open-install-instructions');
    },
    openRecordInstructions(): void {
      this.$root.$emit('open-record-instructions');
    },
  },
});
</script>

<style lang="scss" scoped>
a {
  text-decoration: none;
  color: $lightblue;

  &:hover {
    color: $blue;
    transition: $transition;
    cursor: pointer;
  }
}

.mb-0 {
  margin-bottom: 0;
}

.instructions__stats {
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
}
</style>
