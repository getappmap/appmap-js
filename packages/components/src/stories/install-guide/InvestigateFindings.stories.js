import VInvestigateFindings from '@/pages/install-guide/InvestigateFindings.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages/Investigate Findings',
  component: VInvestigateFindings,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VInvestigateFindings },
  template: '<v-investigate-findings v-bind="$props" />',
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
  findingsEnabled: true,
};

export const Empty = Template.bind({});
Empty.args = {
  scanned: true,
  projectPath: '/home/dev/project',
  numFindings: 0,
  findingsDomainCounts: {
    security: 0,
    performance: 0,
    stability: 0,
    maintainability: 0,
  },
  findingsEnabled: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  scanned: true,
  projectPath: '/home/dev/project',
  numFindings: 0,
  findingsDomainCounts: {
    security: 0,
    performance: 0,
    stability: 0,
    maintainability: 0,
  },
  findingsEnabled: false,
};

export const NotScanned = Template.bind({});
NotScanned.args = {
  scanned: false,
  findingsEnabled: true,
};
