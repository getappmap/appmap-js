import VTabs from '@/components/Tabs.vue';
import VTab from '@/components/Tab.vue';

export default {
  title: 'AppLand/Layouts',
  component: VTabs,
  argTypes: {},
  args: {
    tabs: ['Tab one', 'Tab two'],
  },
};

export const tabs = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VTabs, VTab },
  template: `
    <v-tabs>
      <v-tab name="Tab one">Tab content #1</v-tab>
      <v-tab name="Tab two">... and tab content #2</v-tab>
    </v-tabs>
  `,
});
