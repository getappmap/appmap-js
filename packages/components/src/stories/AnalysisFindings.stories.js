import VAnalysisFindings from '@/pages/AnalysisFindings.vue';

export default {
  title: 'Pages/VS Code/Analysis Findings',
  component: VAnalysisFindings,
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { VAnalysisFindings },
  template: '<v-analysis-findings v-bind="$props" />',
});

export const WithNoFindings = Template.bind({});
WithNoFindings.args = {
  findings: [],
};

export const WithFindings = Template.bind({});
WithFindings.args = {
  findings: [
    {
      finding: {
        ruleTitle: 'Secret in log',
        impactDomain: 'Security',
        hash_v2: 'abcdefghijklmnopqrstuvwxyz1234567890',
      },
    },
    {
      finding: {
        ruleTitle: 'N plus 1 SQL query',
        impactDomain: 'Performance',
        hash_v2: 'abcdefghijklmnopqrstuvwxyz0987654321',
      },
    },
    {
      finding: {
        ruleTitle: 'Deserialization of untrusted data',
        impactDomain: 'Security',
        hash_v2: 'zyxwvutsrqponmlkjihgfedcba1234567890',
      },
    },
  ],
};
