import VFindingDetails from '@/pages/install-guide/FindingDetails.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages/Finding details',
  component: VFindingDetails,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VFindingDetails },
  template: '<v-finding-details v-bind="$props" />',
});

export const WithFindings = Template.bind({});
WithFindings.args = {
  scanned: true,
  projectPath: '/home/dev/project',
  numFindings: 10,
  findingsDomainCounts: {
    security: 1,
    performance: 3,
    stability: 4,
    maintainability: 2,
  },
  analysisEnabled: true,
  userAuthenticated: true,
  findingsEnabled: true,
};
