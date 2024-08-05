import { mount, createWrapper } from '@vue/test-utils';
import ProjectConfiguration from '@/components/install-guide/ProjectConfiguration.vue';

describe('ProjectConfiguration.vue', () => {
  describe('project selection', () => {
    describe('one project', () => {
      const name = 'my-project';
      const path = '/home/user/my-project';

      it('automatically selects the first project', async () => {
        const project = { name, path };
        const wrapper = mount(ProjectConfiguration, {
          propsData: { projects: [project] },
        });

        // There's a one tick delay
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedProject).toEqual(project);
        expect(wrapper.find('[data-cy="selected-project"]').text()).toBe(name);
      });
    });

    describe('many projects', () => {
      let wrapper, root;
      const name = 'my-project';
      const path = '/home/user/my-project';
      const projects = [
        { name, path },
        { name: 'other-project', path: '/home/user/other-project' },
      ];

      beforeEach(() => {
        wrapper = mount(ProjectConfiguration, {
          propsData: { projects },
        });
        root = createWrapper(wrapper.vm.$root);
      });

      it('lists the available projects', () => {
        expect(wrapper.findAll('[data-cy="project-list-item"]').length).toBe(2);
        expect(
          wrapper.findAll('[data-cy="project-name"]').wrappers.map((e) => e.text())
        ).toStrictEqual(projects.map((p) => p.name));
        expect(
          wrapper.findAll('[data-cy="project-path"]').wrappers.map((e) => e.text())
        ).toStrictEqual(projects.map((p) => p.path));
      });

      it('moves to the next step when a project is selected', async () => {
        wrapper.find('[data-cy="project-list-item"]').trigger('click');

        // There's a one tick delay
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedProject).toEqual(projects[0]);
        expect(wrapper.find('[data-cy="selected-project"]').text()).toBe(name);
        expect(wrapper.find('[data-cy="language-selection"][data-active]').exists()).toBe(true);
      });

      it('emits a select-project event when a project is selected', async () => {
        const project = projects[0];
        wrapper.find('[data-cy="project-list-item"]').trigger('click');
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted()['select-project']).toEqual([[project]]);
      });
    });
  });

  describe('', () => {
    let wrapper, root;
    const name = 'my-project';
    const path = '/home/user/my-project';
    const project = { name, path };
    beforeEach(() => {
      wrapper = mount(ProjectConfiguration, {
        propsData: { projects: [project] },
      });
      root = createWrapper(wrapper.vm.$root);
    });

    describe('language selection', () => {
      beforeEach(() => wrapper.setData({ selectedProject: project, openSection: 'language' }));

      it('lists the available languages', () => {
        expect(wrapper.findAll('[data-cy="language-button"]').length).toBe(4);
        ['java', 'python', 'ruby', 'node.js'].forEach((language) => {
          expect(
            wrapper.find(`[data-cy="language-button"][data-language="${language}"]`).exists()
          ).toBe(true);
        });
      });

      it('moves to the next step when a language is selected', async () => {
        wrapper.find('[data-cy="language-button"][data-language="ruby"]').trigger('click');

        // There's a one tick delay
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedLanguage).toEqual('ruby');
        expect(wrapper.find('[data-cy="selected-language"]').text()).toBe('Ruby');
        expect(wrapper.find('[data-cy="configure-project"][data-active]').exists()).toBe(true);
      });

      it('emits a select-language event when a language is selected', async () => {
        wrapper.find('[data-cy="language-button"][data-language="java"]').trigger('click');
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted()['select-language']).toEqual([['java']]);
      });

      it('presents navie if the language is not listed', async () => {
        wrapper.find('[data-cy="language-other"]').trigger('click');
        await wrapper.vm.$nextTick();
        expect(wrapper.find('[data-cy="selected-language"]').text()).toBe('Other');
        expect(wrapper.find('[data-cy="configure-project"][data-active]').text()).toContain(
          "AppMap trace data recording isn't possible for this project"
        );
        const nextButton = wrapper.find('[data-cy="next-button"]');
        expect(nextButton.text()).toBe('Next: Chat with Navie');

        // The next button should emit a specific event
        nextButton.trigger('click');
        expect(root.emitted()['open-navie']).toEqual([[]]);
      });

      it('does not present additional options if the language is other', async () => {
        await wrapper.setData({ selectedLanguageName: 'other' });
        expect(wrapper.find('[data-cy="record-project"]').exists()).toBe(false);
      });
    });

    describe('configure project', () => {
      beforeEach(() => wrapper.setData({ selectedProject: project, openSection: 'content' }));

      it('displays the expected content', async () => {
        const contentMatches = {
          java: 'In Java applications',
          python: 'your Python project',
          ruby: 'your Ruby project',
          'node.js': 'appmap-node module',
        };
        for (const language of Object.keys(contentMatches)) {
          await wrapper.setData({ selectedLanguageName: language });
          expect(wrapper.find('[data-cy="configure-project"][data-active]').text()).toContain(
            contentMatches[language]
          );
        }
      });
    });

    it('renders Java differently in Visual Studio Code and JetBrains', async () => {
      const contentMatches = {
        vscode: 'Visual Studio Code',
        jetbrains: 'This plugin adds an executor',
      };

      for (const editor of Object.keys(contentMatches)) {
        await wrapper.setData({ selectedLanguageName: 'java', openSection: 'content' });
        await wrapper.setProps({ editor });
        expect(wrapper.find('[data-cy="configure-project"][data-active]').text()).toContain(
          contentMatches[editor]
        );
      }
    });

    describe('record appmaps', () => {
      beforeEach(() =>
        wrapper.setData({
          selectedProject: project,
          selectedLanguageName: 'node.js',
          openSection: 'record',
        })
      );

      it('displays the expected content', async () => {
        const contentMatches = {
          java: '.appmap/lib/java/appmap.jar',
          python: 'your Python application',
          ruby: 'appmap gem',
          'node.js': 'appmap-node command',
        };
        for (const language of Object.keys(contentMatches)) {
          await wrapper.setData({ selectedLanguageName: language });
          expect(wrapper.find('[data-cy="record-project"][data-active]').text()).toContain(
            contentMatches[language]
          );
        }
      });

      it('renders Java differently in Visual Studio Code and JetBrains', async () => {
        const contentMatches = {
          vscode: '.appmap/lib/java/appmap.jar',
          jetbrains: '"Start with AppMap" option',
        };

        for (const editor of Object.keys(contentMatches)) {
          await wrapper.setData({ selectedLanguageName: 'java', openSection: 'record' });
          await wrapper.setProps({ editor });
          expect(wrapper.find('[data-cy="record-project"][data-active]').text()).toContain(
            contentMatches[editor]
          );
        }
      });

      it('presents a button to open navie', async () => {
        const nextButton = wrapper.find('[data-cy="end-button"]');
        expect(nextButton.text()).toBe('Next: Chat with Navie');
        nextButton.trigger('click');
        expect(root.emitted()['open-navie']).toEqual([[]]);
      });
    });
  });
});
