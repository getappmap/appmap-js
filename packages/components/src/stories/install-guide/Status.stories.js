import VStatus from '@/components/install-guide/Status.vue';
import { InstructionStep, StepStatus } from '@/components/install-guide/Status.vue';

export default {
  title: 'AppLand/UI/Install Status',
  component: VStatus,
  argTypes: {
    currentStep: {
      control: { type: 'range', min: 0, max: InstructionStep.NumSteps - 1 },
      defaultValue: 0,
    },
    viewingStep: {
      control: { type: 'range', min: 0, max: InstructionStep.NumSteps - 1 },
      defaultValue: 1,
    },
    currentStepState: {
      control: { type: 'range', min: 0, max: StepStatus.NumStatuses - 1 },
      defaultValue: StepStatus.InProgress,
    },
    projectName: {
      control: { type: 'text' },
      defaultValue: 'my-project',
    },
    numAppMaps: {
      control: { type: 'number' },
      defaultValue: 256,
    },
    statusStates: { control: { type: null } },
  },
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes).filter((key) => key !== 'currentStatus' && key !== 'statusStates'),
  components: { VStatus },
  computed: {
    statusStates() {
      return [
        ...Array(this.currentStep).fill(StepStatus.Completed),
        this.currentStepState,
        ...Array(InstructionStep.NumSteps - this.currentStep - 1).fill(StepStatus.NotStarted),
      ];
    },
  },
  template: `
  <div style="margin: 6em; font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <v-status v-bind="$props" :status-states="statusStates" />
  </div>
  `,
});

export const installStatus = Template.bind({});
