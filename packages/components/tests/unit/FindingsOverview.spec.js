import { mount, createWrapper } from '@vue/test-utils';
import AnalysisFindings from '@/pages/AnalysisFindings.vue';

const propsData = {
  findings: [
    {
      finding: {
        ruleTitle: 'Deserialization of untrusted data',
        impactDomain: 'Security',
        hash_v2: 'zyxwvutsrqponmlkjihgfedcba1234567890',
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
        ruleTitle: 'Secret in log',
        impactDomain: 'Security',
        hash_v2: 'abcdefghijklmnopqrstuvwxyz1234567890',
      },
    },
  ],
};

describe('Findings overview', () => {
  let wrapper; // Wrapper<Vue>
  let rootWrapper; // Wrapper<Vue>

  beforeEach(() => {
    wrapper = mount(AnalysisFindings, { propsData });
    rootWrapper = createWrapper(wrapper.vm.$root);
  });

  it('emits the correct event when attempting to open finding details', async () => {
    expect(rootWrapper.emitted()['open-finding-info']).toBeUndefined();
    expect(wrapper.findAll('[data-cy="finding"]').at(0).text()).toContain(
      'Deserialization of untrusted data'
    );

    const expected = [[propsData.findings[0].finding.hash_v2]];
    const rows = wrapper.findAll('.item');

    await rows.at(1).trigger('click');
    let actual = rootWrapper.emitted()['open-finding-info'];
    expect(actual).toBeArrayOfSize(1);
    expect(actual).toMatchObject(expected);

    expected.push([propsData.findings[1].finding.hash_v2]);
    await rows.at(2).trigger('click');
    actual = rootWrapper.emitted()['open-finding-info'];
    expect(actual).toBeArrayOfSize(2);
    expect(actual).toMatchObject(expected);

    expected.push([propsData.findings[2].finding.hash_v2]);
    await rows.at(3).trigger('click');
    actual = rootWrapper.emitted()['open-finding-info'];
    expect(actual).toBeArrayOfSize(3);
    expect(actual).toMatchObject(expected);
  });

  it('emits the correct event when opening the problems tab', () => {
    expect(rootWrapper.emitted()['open-problems-tab']).toBeUndefined();
    wrapper.find('[data-cy="problems-tab-button"]').trigger('click');
    expect(rootWrapper.emitted()['open-problems-tab']).toBeArrayOfSize(1);
    expect(rootWrapper.emitted()['open-problems-tab']).toMatchObject([[]]);
  });
});
