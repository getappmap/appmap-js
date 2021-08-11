import VPopper from '@/components/Popper.vue';

export default {
  title: 'AppLand/UI/Popper',
  component: VPopper,
  argTypes: {
    placement: {
      control: { type: 'select', options: ['top', 'bottom', 'left', 'right'] },
      defaultValue: 'top',
    },
    text: {
      control: 'text',
      defaultValue: 'Hello world!',
    },
  },
};

export const popper = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VPopper },
  template:
    '<div style="transform: translate(-50%, -50%);left: 50%;top: 50%;position: absolute;"><v-popper v-bind="$props">Mouse over me</v-popper></div>',
});
