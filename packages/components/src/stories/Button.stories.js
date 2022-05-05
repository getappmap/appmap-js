import VButton from '@/components/Button.vue';

export default {
  title: 'AppLand/UI/Button',
  component: VButton,
  argTypes: {
    kind: {
      control: { type: 'select', options: ['primary', 'secondary', 'ghost'] },
    },
    size: {
      control: { type: 'select', options: ['small', 'medium', 'large'] },
    },
  },
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VButton },
  template: '<v-button v-bind="$props" />',
});

export const Primary = Template.bind({});
Primary.args = {
  label: 'Button',
};

export const Secondary = Template.bind({});
Secondary.args = {
  kind: 'secondary',
  label: 'Button',
};

export const Ghost = Template.bind({});
Ghost.args = {
  kind: 'ghost',
  label: 'Button',
};

export const Large = Template.bind({});
Large.args = {
  size: 'large',
  label: 'Button',
};

export const Small = Template.bind({});
Small.args = {
  size: 'small',
  label: 'Button',
};
