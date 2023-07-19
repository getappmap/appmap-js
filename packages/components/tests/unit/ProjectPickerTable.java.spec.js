import { mount, createWrapper } from '@vue/test-utils';
import ProjectPickerTable from '@/components/install-guide/ProjectPickerTable.vue';

describe('ProjectPickerTable.vue (Java)', () => {
  let wrapper, root;

  const agentStatus = Object.freeze({
    pending: 0,
    installing: 1,
    installed: 2,
    error: 3,
  });

  const configStatus = Object.freeze({
    pending: 0,
    installed: 1,
    error: 2,
  });

  const project = {
    name: 'my_java_project',
    score: 2,
    path: '/home/user/my_java_project',
    language: {
      name: 'Java',
      score: 2,
    },
    webFramework: {
      name: 'Spring',
      score: 2,
    },
    debugConfigurationStatus: configStatus.pending,
  };

  beforeEach(() => {
    wrapper = mount(ProjectPickerTable, {
      propsData: {
        projects: [project],
        javaAgentStatus: agentStatus.pending,
        editor: 'vscode',
      },
    });
    root = createWrapper(wrapper.vm.$root);
  });

  describe('agent install status', () => {
    function getDownloadStatus(status) {
      return wrapper.find(`[data-cy="status-agent-download"][data-status="${status}"]`);
    }

    function setDownloadStatus(status) {
      return wrapper.setProps({ javaAgentStatus: status });
    }

    it('displays the pending status', async () => {
      await setDownloadStatus(agentStatus.pending);
      expect(getDownloadStatus('pending').exists()).toBe(true);

      await setDownloadStatus(agentStatus.installing);
      expect(getDownloadStatus('pending').exists()).toBe(true);
    });

    it('displays the success status', async () => {
      await setDownloadStatus(agentStatus.installed);
      expect(getDownloadStatus('success').exists()).toBe(true);
    });

    it('displays the failure status', async () => {
      await setDownloadStatus(agentStatus.error);
      expect(getDownloadStatus('failure').exists()).toBe(true);
    });

    it('emits expected events', async () => {
      await setDownloadStatus(agentStatus.error);
      wrapper.find('[data-cy="view-output"]').trigger('click');
      const events = root.emitted();
      expect(events['view-output']).toBeTruthy();
      expect(events['view-output']).toEqual([[]]);
    });
  });

  describe('debug configuration status', () => {
    function getDebugConfigStatus(status) {
      return wrapper.find(`[data-cy="status-debug-config"][data-status="${status}"]`);
    }

    function setDebugConfigStatus(status) {
      return wrapper.setProps({ projects: [{ ...project, debugConfigurationStatus: status }] });
    }

    it('displays the pending status', async () => {
      await setDebugConfigStatus(configStatus.pending);
      expect(getDebugConfigStatus('pending').exists()).toBe(true);
    });

    it('displays the success status', async () => {
      await setDebugConfigStatus(configStatus.installed);
      expect(getDebugConfigStatus('success').exists()).toBe(true);
    });

    it('displays the failure status', async () => {
      await setDebugConfigStatus(configStatus.error);
      expect(getDebugConfigStatus('failure').exists()).toBe(true);
    });

    it('emits expected events', async () => {
      await setDebugConfigStatus(configStatus.error);
      wrapper.find('[data-cy="add-java-configs"]').trigger('click');
      const events = root.emitted();
      expect(events['add-java-configs']).toBeTruthy();
      expect(events['add-java-configs']).toEqual([['/home/user/my_java_project']]);
    });
  });
});
