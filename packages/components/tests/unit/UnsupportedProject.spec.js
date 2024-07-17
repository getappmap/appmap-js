import { shallowMount } from '@vue/test-utils';
import UnsupportedProject from '@/components/install-guide/UnsupportedProject.vue';

describe('UnsupportedProject.vue', () => {
  it('user is informed of the state with a link to Navie', () => {
    const wrapper = shallowMount(UnsupportedProject, {
      propsData: { editor: 'vscode', project: { language: 'C#' } },
    });
    const informUserMessage = wrapper.find('[data-cy="inform-user"]').text();
    expect(informUserMessage).toContain('While AppMap data cannot be recorded for this project,');
    expect(informUserMessage).toContain('Navie');
    expect(informUserMessage).toContain(
      'can still search through the code available in your project.'
    );
    expect(wrapper.find('a[href]').text()).toBe('Navie');
  });
});
