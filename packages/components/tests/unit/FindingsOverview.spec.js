import { mount } from '@vue/test-utils';
import AnalysisFindings from '@/pages/AnalysisFindings.vue';
import eventBus from '@/lib/eventBus';

const props = {
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
  let wrapper;
  let openFindingSpy;
  let openProblemsSpy;

  beforeEach(() => {
    wrapper = mount(AnalysisFindings, { props });
    openFindingSpy = jest.fn();
    openProblemsSpy = jest.fn();
    eventBus.on('open-finding-info', openFindingSpy);
    eventBus.on('open-problems-tab', openProblemsSpy);
  });

  afterEach(() => {
    eventBus.off('open-finding-info', openFindingSpy);
    eventBus.off('open-problems-tab', openProblemsSpy);
  });

  it('emits the correct event when attempting to open finding details', async () => {
    expect(openFindingSpy).not.toHaveBeenCalled();
    expect(wrapper.findAll('[data-cy="finding"]').at(0).text()).toContain(
      'Deserialization of untrusted data'
    );

    const rows = wrapper.findAll('.item');

    await rows.at(1).trigger('click');
    expect(openFindingSpy).toHaveBeenCalledTimes(1);
    expect(openFindingSpy).toHaveBeenCalledWith(props.findings[0].finding.hash_v2);

    await rows.at(2).trigger('click');
    expect(openFindingSpy).toHaveBeenCalledTimes(2);
    expect(openFindingSpy).toHaveBeenCalledWith(props.findings[1].finding.hash_v2);

    await rows.at(3).trigger('click');
    expect(openFindingSpy).toHaveBeenCalledTimes(3);
    expect(openFindingSpy).toHaveBeenCalledWith(props.findings[2].finding.hash_v2);
  });

  it('emits the correct event when opening the problems tab', async () => {
    expect(openProblemsSpy).not.toHaveBeenCalled();
    await wrapper.find('[data-cy="problems-tab-button"]').trigger('click');
    expect(openProblemsSpy).toHaveBeenCalledTimes(1);
  });
});
