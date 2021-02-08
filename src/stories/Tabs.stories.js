import VTabs from '@/components/Tabs.vue';
import VTabButton from '../components/TabButton.vue';

export default {
  title: 'AppLand/Layouts',
  component: VTabs,
  argTypes: {},
  args: {
    tabs: [
      { key: 'tab1', name: 'Tab One', isActive: true },
      { key: 'tab2', name: 'Tab Two', isActive: false },
    ],
  },
};

export const tabs = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VTabButton, VTabs },
  data: () => ({ isActiveTab: true }),
  template: `
    <v-tabs :tabs="tabs">
      <keep-alive>
        <v-tab-button
          v-if="isActiveTab"
          label="Dummy Button"
        />
      </keep-alive>
    </v-tabs>
  `,
});
