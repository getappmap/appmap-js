<template>
  <div class="java-status">
    <div data-cy="status-debug-config" :data-status="debugConfigurationStatus">
      <template v-if="debugConfigurationStatus === 'success'">
        <v-flash-message type="info">
          <span class="split">
            <v-success-icon class="status-icon" />
            <span>Test and debug configurations have been added to {{ projectName }}.</span>
          </span>
        </v-flash-message>
      </template>
      <template v-else-if="debugConfigurationStatus === 'pending'">
        <v-flash-message type="info">
          <span class="split">
            <v-spinner><v-loader-icon class="status-icon" /></v-spinner>
            <span>Test and debug configurations are being added to {{ projectName }}.</span>
          </span>
        </v-flash-message>
      </template>
      <template v-else-if="debugConfigurationStatus === 'failure'">
        <v-flash-message type="error">
          <span class="split">
            <v-failure-icon class="status-icon status-icon--failure" />
            <span>
              Test and debug configurations couldn't be located for {{ projectName }}. To try adding
              them again,
              <a
                href="#"
                @click.stop.prevent="$root.$emit('add-java-configs', projectPath)"
                data-cy="add-java-configs"
              >
                click here.
              </a>
            </span>
          </span>
        </v-flash-message>
      </template>
      <template v-else-if="debugConfigurationStatus === 'requesting'">
        <v-flash-message type="info">
          <span class="split">
            <v-spinner><v-loader-icon class="status-icon" /></v-spinner>
            <span>Launch configurations have not yet been added to {{ projectName }}.</span>
            <v-button
              kind="ghost"
              class="button"
              @click.native="$root.$emit('add-java-configs', projectPath)"
            >
              Add them now
            </v-button>
          </span>
        </v-flash-message>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import VFlashMessage from '@/components/FlashMessage.vue';
import VSpinner from '@/components/Spinner.vue';
import VLoaderIcon from '@/assets/eva_loader-outline.svg';
import VFailureIcon from '@/assets/exclamation-circle.svg';
import VSuccessIcon from '@/assets/check.svg';
import VButton from '@/components/Button.vue';

export default Vue.extend({
  components: {
    VFlashMessage,
    VSpinner,
    VLoaderIcon,
    VFailureIcon,
    VSuccessIcon,
    VButton,
  },
  props: {
    projectName: String,
    projectPath: String,
    enumDebugConfigurationStatus: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },
  },
  computed: {
    hasDebugConfigurationStatus(): boolean {
      return typeof this.enumDebugConfigurationStatus !== 'undefined';
    },
    debugConfigurationStatus(): string | undefined {
      switch (this.enumDebugConfigurationStatus) {
        case 0:
          return 'pending';
        case 1:
          return 'success';
        case 2:
          return 'failure';
        default:
          return 'requesting';
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.java-status {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  width: 100%;

  .status-icon {
    display: flex;
    width: 18px;
    height: 18px;
    margin: -4px 0.5em -4px 0.5em;
    transform-origin: center;

    path {
      fill: $lightblue;
    }

    &--failure path {
      fill: $bad-status;
    }
  }

  .split {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    gap: 1rem;
    align-items: center;
  }

  .button {
    border-color: $lightblue;
    color: $lightblue;
    margin-left: auto;

    &:hover {
      background-color: rgba(white, 0.75);
      border-color: white;
      color: black;
    }
  }
}
</style>
