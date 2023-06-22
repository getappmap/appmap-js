import { mount, createWrapper } from '@vue/test-utils';
import ProjectPickerTable from '@/components/install-guide/ProjectPickerTable.vue';

describe('ProjectPickerTable.vue', () => {
  let wrapper;
  const project = Object.freeze({
    selected: false,
    name: 'my-project',
    score: 3,
    path: '/path/to/my-project',
    language: { name: 'Ruby', score: 2 },
    testFramework: { name: 'RSpec', score: 2 },
    webFramework: { name: 'Rails', score: 2 },
    installComplete: false,
    editor: 'vscode',
    numAppMaps: 256,
  });

  beforeEach(() => {
    wrapper = mount(ProjectPickerTable, { propsData: { projects: [project] } });
  });

  it('expands a project when the header is clicked', async () => {
    expect(wrapper.find('[data-cy="project-body"]').isVisible()).toBe(false);

    wrapper.find('[data-cy="project-header"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="project-body"]').isVisible()).toBe(true);
  });

  it('does not toggle the accordion when clicking the body', async () => {
    expect(wrapper.find('[data-cy="project-body"]').isVisible()).toBe(false);

    wrapper.find('[data-cy="project-header"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="project-body"]').isVisible()).toBe(true);

    wrapper.find('[data-cy="project-body"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-cy="project-body"]').isVisible()).toBe(true);
  });
});
