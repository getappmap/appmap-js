<template>
  <v-status-bar v-if="numAppMaps" level="success">
    <template v-slot:header>
      <div class="context__header">
        {{ numAppMaps }} AppMap recording{{ numAppMaps === 1 ? '' : 's' }} available
      </div>
    </template>
    <template v-slot:body>
      <div class="context__table mb-0">
        <div class="context__table__row">
          <v-success-icon class="success-icon" data-cy="success-icon" />
          <div>Runtime traces (AppMap recordings)</div>
        </div>
        <div class="context__table__row">
          <v-success-icon class="success-icon" data-cy="success-icon" />
          <div>Source code snippets</div>
        </div>
        <div class="context__table__row">
          <v-success-icon class="success-icon" data-cy="success-icon" />
          <div>Data requests</div>
        </div>
      </div>
    </template>
  </v-status-bar>

  <v-status-bar v-else level="info">
    <template v-slot:header>
      <div class="context__header">No AppMap data available</div>
    </template>
    <template v-slot:body>
      <div class="context__sub-header">
        <div class="context__table">
          <div class="context__table__row">
            <v-fail-icon class="fail-icon" data-cy="fail-icon" />
            <div>Runtime traces (AppMap recordings)</div>
          </div>
          <div class="context__table__row">
            <v-fail-icon class="fail-icon" data-cy="fail-icon" />
            <div>Source code snippets</div>
          </div>
          <div class="context__table__row">
            <v-fail-icon class="fail-icon" data-cy="fail-icon" />
            <div>Data requests</div>
          </div>
        </div>
        <p class="mt-0">
          You can still ask Navie questions, but Navie only has partial information about your
          project.
        </p>
        <p v-if="appmapStats && numAppMaps === 0" class="mt-0 mb-0" data-cy="status-no-data">
          You need to
          <a href="#" @click.prevent="openRecordInstructions" data-cy="record-guide">
            record runtime data
          </a>
          for Navie to know about your project.
        </p>
      </div>
    </template>
  </v-status-bar>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VStatusBar from '@/components/chat-search/StatusBar.vue';
import VFailIcon from '@/assets/close.svg';
import VSuccessIcon from '@/assets/success-checkmark.svg';
import { AppMapRpc } from '@appland/rpc';

export default Vue.extend({
  name: 'v-context-status',

  components: {
    VStatusBar,
    VFailIcon,
    VSuccessIcon,
  },

  data() {
    return {
      showFullStatus: false,
    };
  },

  props: {
    appmapStats: Array as PropType<AppMapRpc.Stats.V2.Response | undefined>,
  },

  computed: {
    numAppMaps(): number {
      return (this.appmapStats || []).reduce((acc, { numAppMaps }) => acc + numAppMaps, 0);
    },
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
  margin-bottom: 0 !important;
}

.mt-0 {
  margin-top: 0 !important;
}

.context {
  background-color: #181c28;
  padding: 1.75rem;

  h2 {
    margin-bottom: 1.25rem;
    margin-top: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    font-weight: 600;

    .warning-icon {
      width: 15px;
      fill: white;
      margin-right: 0.5rem;
    }
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

  &__table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;

    &__row {
      display: flex;
      align-items: center;
      padding: 0 0.5rem;
      gap: 0.75rem;

      .fail-icon,
      .success-icon {
        width: 15px;
      }

      .fail-icon {
        fill: #d62525;
      }
    }
  }
}
</style>
