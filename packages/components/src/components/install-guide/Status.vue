<template>
  <div class="status-message" data-cy="status">
    <div :class="progressBarClasses">
      <ProgressIndicator data-cy="status-indicator" />
    </div>
    <div class="status-message__body">
      <p :class="headerClasses" data-cy="header">
        <component :is="header" />
      </p>
      <p class="status-message__prompt" v-if="prompt && !allComplete" data-cy="prompt">
        <template v-if="currentStepComplete && !shouldGoBack"> Next step: </template>
        <template v-if="shouldGoBack">
          <a href="#" @click.prevent="$root.$emit('status-jump', nextStep)" data-cy="go-back">
            Go back
          </a>
          and
        </template>
        <component :is="prompt" />
      </p>
    </div>
    <transition name="fade">
      <v-button
        class="status-message__next-step"
        kind="primary"
        data-cy="next-step"
        v-if="button && currentStepComplete && viewingStep !== nextStep"
        @click.native="$root.$emit('status-jump', nextStep)"
      >
        Next step: {{ button }}
      </v-button>
    </transition>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VButton from '@/components/Button.vue';
import ProgressIndicator from '@/assets/progress-indicator-4-segments.svg';

export enum StepStatus {
  NotStarted = 0,
  InProgress,
  Completed,
  NumStatuses,
}

export enum InstructionStep {
  ProjectPicker = 0,
  RecordAppMaps,
  ExploreAppMaps,
  RuntimeAnalysis,
  NumSteps,
}

export default {
  name: 'StatusInfo',

  components: {
    VButton,
    ProgressIndicator,
  },

  props: {
    viewingStep: {
      type: Number,
      required: true,
    },
    statusStates: {
      type: Array,
      required: true,
      default: () => Array(InstructionStep.NumSteps).fill(StepStatus.NotStarted),
    },
    projectName: {
      type: String,
      required: true,
      default: '',
    },
    numAppMaps: {
      type: Number,
      required: false,
      default: 0,
    },
  },

  data: () => ({
    templates: {
      [InstructionStep.ProjectPicker]: {
        complete: {
          header: 'AppMap has been added to {{projectName}}',
          prompt: 'Choose a recording method and record AppMaps',
        },
        incomplete: {
          header: 'The AppMap dependencies have not been added to {{projectName}}',
          prompt: 'Add them manually or with the installer',
        },
      },
      [InstructionStep.RecordAppMaps]: {
        button: 'Record AppMaps',
        complete: {
          header: `{{numAppMaps}} AppMap{{numAppMaps == 1 ? ' has' : 's have'}} been recorded for {{projectName}}`,
          prompt: 'Choose an AppMap to open and explore',
        },
        incomplete: {
          header: 'No AppMaps have been recorded yet for {{projectName}}',
          prompt: 'Record AppMaps using one of the suggested methods',
        },
      },
      [InstructionStep.ExploreAppMaps]: {
        button: 'Explore AppMaps',
        complete: {
          header: `{{projectName}} has {{numAppMaps}} AppMap{{numAppMaps == 1 ? '' : 's'}}`,
          prompt: 'Generate OpenAPI Definitions from AppMap data',
        },
        incomplete: {
          header: `{{projectName}} has {{numAppMaps}} AppMap{{numAppMaps == 1 ? '' : 's'}}`,
          prompt: 'Open an AppMap',
        },
      },
      [InstructionStep.RuntimeAnalysis]: {
        button: 'Runtime Analysis',
        complete: {
          header: 'AppMap setup is complete for {{projectName}}',
        },
        incomplete: {
          header: `{{projectName}} has {{numAppMaps}} AppMap{{numAppMaps == 1 ? '' : 's'}}`,
          prompt: 'View the runtime analysis report for {{projectName}}',
        },
      },
    },
    allCompleteMessage: 'AppMap setup is complete for {{projectName}}',
  }),

  watch: {
    statusStates() {
      this.updateSegments();
    },
  },

  computed: {
    stepComplete(): boolean {
      return this.currentStatus === StepStatus.Completed;
    },
    progressBarClasses(): Record<string, boolean> {
      return {
        'status-message__progress-indicator': true,
        'status-message__progress-indicator--success': this.statusStates.every(
          (status) => status === StepStatus.Completed
        ),
      };
    },
    headerClasses(): Record<string, boolean> {
      return {
        'status-message__heading': true,
        'status-message--warning': this.visibleStatus === StepStatus.InProgress,
        'status-message--success': this.visibleStatus === StepStatus.Completed,
        'status-message--finished': this.allComplete,
      };
    },
    currentStepComplete() {
      return this.statusStates[this.viewingStep] === StepStatus.Completed;
    },
    visibleStep() {
      return this.currentStepComplete ? this.viewingStep : this.nextStep;
    },
    visibleStatus() {
      return this.currentStepComplete ? StepStatus.Completed : StepStatus.InProgress;
    },
    nextStep() {
      const next = this.statusStates.findIndex((status) => status !== StepStatus.Completed);
      return next >= 0 ? next : Math.min(this.viewingStep + 1, InstructionStep.NumSteps - 1);
    },
    currentStatus() {
      return this.statusStates[this.nextStep];
    },
    currentContent() {
      const { complete, incomplete } = this.templates[this.visibleStep];
      return this.currentStepComplete ? complete : incomplete || { header: '', prompt: '' };
    },
    nextStepContent() {
      return this.templates[this.nextStep].incomplete;
    },
    shouldGoBack() {
      return this.nextStep < this.viewingStep;
    },
    header() {
      const template = this.allComplete ? this.allCompleteMessage : this.currentContent.header;
      // Referencing the dynamic props directly in this block
      // is required to maintain reactivity
      const projectName = this.projectName;
      const numAppMaps = this.numAppMaps;
      return {
        template: `<span>${template}</span>`,
        data: () => ({
          projectName,
          numAppMaps,
        }),
      };
    },
    prompt() {
      const prompt = this.currentStepComplete
        ? this.nextStepContent?.prompt
        : this.currentContent.prompt;
      const template = this.shouldGoBack
        ? prompt.charAt(0).toLowerCase() + prompt.slice(1)
        : prompt;

      // Referencing the dynamic props directly in this block
      // is required to maintain reactivity
      const projectName = this.projectName;
      const numAppMaps = this.numAppMaps;

      return {
        template: `<span>${template}</span>`,
        data: () => ({
          projectName,
          numAppMaps,
        }),
      };
    },
    button() {
      const buttonContent = this.templates[this.nextStep].button;
      if (!buttonContent) return;

      return this.renderTemplateString(buttonContent);
    },
    allComplete() {
      return this.statusStates.every((status) => status === StepStatus.Completed);
    },
  },

  methods: {
    updateSegments() {
      this.statusStates.forEach((status, index) => {
        const segment = this.$el.querySelector(`svg .segment[data-index="${index}"]`);
        segment?.classList.remove('completed', 'in-progress');
        if (status === StepStatus.Completed) {
          segment?.classList.add('completed');
        } else if (status === StepStatus.InProgress) {
          segment?.classList.add('in-progress');
        }
      });
    },
    renderTemplateString(template: string) {
      if (!template) return '';

      return template.replace(/{{\s*(\w+)\s*}}/g, (_, varName) => {
        return this[varName];
      });
    },
  },

  mounted() {
    this.updateSegments();
  },

  updated() {
    this.updateSegments();
  },
};
</script>

<style scoped lang="scss">
.status-message {
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
  &__body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }
  &__prompt {
    margin-top: 0px;
    color: $gray4;
  }
  &__progress-indicator {
    display: grid;
    align-items: center;
    padding: 0 1rem 0 0.5rem;

    &--success {
      path.check {
        opacity: 1 !important;
      }
    }

    path {
      fill: #585858;
      transition: fill 0.5s ease;
      &.check {
        opacity: 0;
        fill: #3bf804;
        transition: opacity 0.5s ease-in-out;
      }
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
  &--finished {
    margin: 0;
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
