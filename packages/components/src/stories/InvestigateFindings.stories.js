import VInvestigateFindings from '@/pages/install-guide/InvestigateFindings.vue';

export default {
  title: 'Pages/VS Code/Install Guide Pages',
  component: VInvestigateFindings,
  args: {
    scanned: true,
    numFindings: 16,
    numSecurity: 5,
    numPerformance: 5,
    numStability: 5,
    numMaintainability: 1,
    projectPath: '/home/dev/project',
  },
};

export const investigateFindings = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VInvestigateFindings },
  template: '<v-investigate-findings v-bind="$props" />',
});
