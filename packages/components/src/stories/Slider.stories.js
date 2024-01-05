import VSlider from '@/components/Slider.vue';

export default {
  title: 'AppLand/UI/Slider',
  component: VSlider,
  argTypes: {},
};

const Template = (args, { argTypes }) => ({
  components: { VSlider },
  data() {
    return { state: 0.5 };
  },
  template: `
    <v-slider
      :value="state"
      @slide="(v) => { state = v; }"
    />
  `,
});

export const Slider = Template.bind({});
