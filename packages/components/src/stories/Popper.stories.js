import VPopper from '@/components/Popper.vue';

export default {
  title: 'AppLand/UI/Popper',
  component: VPopper,
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
    },
    text: {
      control: 'text',
    },
  },
  args: {
    placement: 'top',
    text: 'Hello world!',
  },
};

export const Popper = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VPopper },
  template:
    '<div style="transform: translate(-50%, -50%);left: 50%;top: 50%;position: absolute;"><v-popper v-bind="$props">Mouse over me</v-popper></div>',
});
