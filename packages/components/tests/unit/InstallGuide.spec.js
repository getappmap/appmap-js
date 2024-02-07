import { mount, createWrapper } from '@vue/test-utils';
import { InstructionStep, StepStatus } from '@/components/install-guide/Status.vue';
import InstallGuide from '@/pages/InstallGuide.vue';
import MultiPage from '@/pages/MultiPage.vue';

// mock window.scrollTo to avoid console error
window.scrollTo = jest.fn();

describe('InstallGuide.vue', () => {
  let wrapper, root;
  const name = 'my-project';
  const project = {
    name,
    score: 3,
    numAppMaps: 0,
    language: {
      name: 'Ruby',
      score: 3,
    },
    testFramework: {
      name: 'RSpec',
      score: 3,
    },
    webFramework: {
      name: 'Rails',
      score: 3,
    },
  };

  function assertPieSegments(status) {
    // There are 6 pie segments because both instruction pages exist in the DOM
    // at the same time, so there are two pies and two sets of 3 segments
    expect(wrapper.findAll('path.segment').length).toBe(6);

    const { completed, inProgress } = status;

    expect(wrapper.findAll('path.segment.completed').length).toBe(completed * 2);
    expect(wrapper.findAll('path.segment.in-progress').length).toBe(inProgress * 2);
  }

  beforeEach(() => {
    wrapper = mount(InstallGuide, {
      propsData: {
        projects: [project],
      },
    });
    root = createWrapper(wrapper.vm.$root);
  });

  it('renders segments as step state changes', async () => {
    assertPieSegments({ completed: 0, inProgress: 1 });

    let newProject = { ...project, agentInstalled: true };
    await wrapper.setProps({ projects: [newProject] });
    assertPieSegments({ completed: 1, inProgress: 1 });

    newProject = { ...newProject, numAppMaps: 1 };
    await wrapper.setProps({ projects: [newProject] });
    assertPieSegments({ completed: 2, inProgress: 1 });

    newProject = { ...newProject, openedNavie: true };
    await wrapper.setProps({ projects: [newProject] });
    assertPieSegments({ completed: 3, inProgress: 0 });
  });

  it("emits 'open-navie' to the IDE when the user clicks the 'Next step:' button for Navie", async () => {
    const newProject = { ...project, agentInstalled: true, numAppMaps: 1 };
    await wrapper.setProps({ projects: [newProject] });
    assertPieSegments({ completed: 2, inProgress: 1 });

    await wrapper.find('button[data-cy="next-step"]').trigger('click');
    const events = root.emitted();
    expect(events['open-navie']).toBeTruthy();
  });

  it("emits 'open-navie' to the IDE when the user clicks the 'Next' button on the Record AppMaps page", async () => {
    const newProject = { ...project, agentInstalled: true, numAppMaps: 1 };
    await wrapper.setProps({ projects: [newProject] });
    assertPieSegments({ completed: 2, inProgress: 1 });

    // Go to the Record AppMaps page
    await wrapper.find('#project-picker button[data-cy="next-button"]').trigger('click');
    let events = root.emitted();
    expect(events['page']).toEqual([['record-appmaps']]);

    // Click the 'Next' button on the Record AppMaps page
    await wrapper.find('#record-appmaps button[data-cy="next-button"]').trigger('click');
    events = root.emitted();
    expect(events['open-navie']).toBeTruthy();
  });
});
