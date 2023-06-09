import VStatus from '@/components/install-guide/Status.vue';

export default {
  title: 'AppLand/UI/Install Status',
  component: VStatus,
  argTypes: {
    stepStatuses: {
      control: { type: 'object' },
      defaultValue: [0, 0, 0, 0, 0],
    },
    header: {
      control: { type: 'text' },
      defaultValue: 'The AppMap dependencies have not been added to your project.',
    },
    subheader: {
      control: { type: 'text' },
      defaultValue: 'Add them manually or with the installer.',
    },
    nextStep: {
      control: { type: 'text' },
      defaultValue: 'The next thing',
    },
  },
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VStatus },
  template: `<div style="margin: 6em; font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <v-status v-bind="$props">
        <template v-slot:header>
            {{ header }}
        </template>
        <template v-slot:subheader>
            {{ subheader }}
        </template>
    </div>
  </div>`,
});

export const installStatus = Template.bind({});
