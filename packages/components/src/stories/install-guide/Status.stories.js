import VStatus from '@/components/install-guide/Status.vue';
import { InstructionStep, StepStatus } from '@/components/install-guide/Status.vue';

export default {
  title: 'AppLand/UI/Install Status',
  component: VStatus,
  argTypes: {
    currentStep: {
      control: { type: 'range', min: 0, max: InstructionStep.NumSteps - 1 },
    },
    viewingStep: {
      control: { type: 'range', min: 0, max: InstructionStep.NumSteps - 1 },
    },
    currentStepState: {
      control: { type: 'range', min: 0, max: StepStatus.NumStatuses - 1 },
    },
    projectName: {
      control: { type: 'text' },
    },
    numAppMaps: {
      control: { type: 'number' },
    },
    statusStates: { control: { type: null } },
  },
  args: {
    currentStep: 0,
    viewingStep: 1,
    currentStepState: StepStatus.InProgress,
    projectName: 'my-project',
    numAppMaps: 256,
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
