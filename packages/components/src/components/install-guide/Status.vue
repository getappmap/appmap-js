<template>
  <div class="status-message">
    <div class="status-message__progress-indicator">
      <ProgressIndicator />
    </div>
    <div class="status-message__body">
      <p :class="headerClasses">
        <slot name="header" />
      </p>
      <p class="status-message__prompt">
        <slot name="subheader" />
      </p>
    </div>
    <transition name="fade">
      <v-button
        class="status-message__next-step"
        kind="primary"
        v-if="nextStep && stepComplete"
        @click.native="$root.$emit('page-next')"
      >
        Next step: {{ nextStep }}
      </v-button>
    </transition>
  </div>
</template>

<script lang="ts">
import VButton from '@/components/Button.vue';
import ProgressIndicator from '@/assets/progress-indicator.svg';

export enum StepStatus {
  NotStarted,
  InProgress,
  Completed,
}

export default {
  name: 'Status',

  components: {
    VButton,
    ProgressIndicator,
  },

  props: {
    currentStep: {
      type: Number,
      required: true,
      default: 0,
    },
    stepStatuses: {
      type: Array,
      required: true,
      default: () => Array.from({ length: 5 }, () => StepStatus.NotStarted),
    },
    nextStep: {
      type: String,
      required: false,
    },
  },

  watch: {
    stepStatuses() {
      this.updateSegments();
    },
  },

  computed: {
    currentStatus() {
      return this.stepStatuses[this.currentStep];
    },
    stepComplete() {
      return this.currentStatus === StepStatus.Completed;
    },
    headerClasses() {
      return {
        'status-message__heading': true,
        'status-message--warning': this.currentStatus === StepStatus.InProgress,
        'status-message--success': this.currentStatus === StepStatus.Completed,
      };
    },
  },

  methods: {
    updateSegments() {
      this.stepStatuses.forEach((status, index) => {
        console.log(status, index);
        const segment = this.$el.querySelector(`svg .segment[data-index="${index}"]`);
        segment?.classList.remove('completed', 'in-progress');
        if (status === StepStatus.Completed) {
          segment?.classList.add('completed');
        } else if (status === StepStatus.InProgress) {
          segment?.classList.add('in-progress');
        }
      });
    },
  },

  mounted() {
    this.updateSegments();
  },
};
</script>

<style scoped lang="scss">
.status-message {
  margin-top: 1rem;
  background-color: black;
  display: flex;
  &__next-step {
    margin: 0.75rem 1rem 0.75rem auto;
  }
  &__heading {
    font-size: 1.125rem;
    font-weight: bold;
    margin-bottom: 0px;
    padding-bottom: 0px;
    color: $white;
    transition: color 0.5s ease-in-out;
  }
  &__prompt {
    margin-top: 0px;
    color: $gray4;
  }
  &__progress-indicator {
    display: grid;
    align-items: center;
    padding: 0 1rem 0 0.5rem;

    path {
      fill: #585858;
      transition: fill 0.5s ease;
      &.completed {
        fill: #3bf804;
      }
      &.in-progress {
        fill: #ecd228;
      }
    }
  }
  &--warning {
    color: $darkyellow;
  }
  &--success {
    color: $success-indicator;
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 1.5s;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
  }
}
</style>
