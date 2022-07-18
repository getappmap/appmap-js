import VInvestigateFindings from '@/pages/install-guide/InvestigateFindings.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages',
  component: VInvestigateFindings,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VInvestigateFindings },
  template: '<v-investigate-findings v-bind="$props" />',
});

export const InvestigateFindings = Template.bind({});
InvestigateFindings.args = {
  scanned: true,
  projectPath: '/home/dev/project',
  numFindings: 10,
  findingsDomainCounts: {
    security: 1,
    performance: 3,
    stability: 4,
    maintainability: 2,
  },
};

export const InvestigateFindingsEmpty = Template.bind({});
InvestigateFindingsEmpty.args = {
  scanned: true,
  projectPath: '/home/dev/project',
  numFindings: 0,
  findingsDomainCounts: {
    security: 0,
    performance: 0,
    stability: 0,
    maintainability: 0,
  },
};
