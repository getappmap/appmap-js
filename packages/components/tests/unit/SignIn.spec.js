import { shallowMount } from '@vue/test-utils';
import SignIn from '@/components/SignIn.vue';
import sinon from 'sinon';

describe('SignIn.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(SignIn);
  });

  it('activation request cannot be submitted more than once until the previous request is resolved', async () => {
    const fetchStub = jest.fn(() => Promise.resolve());
    global.fetch = fetchStub;
    wrapper.vm.email = 'test@test.com';
    for (let i = 0; i < 5; i++) {
      wrapper.vm.activateWithEmail();
    }

    expect(fetchStub.mock.calls.length).toBe(1);
  });

  it('activation validation cannot be submitted more than once until the previous request is resolved', async () => {
    const fetchStub = jest.fn(() => Promise.resolve());
    global.fetch = fetchStub;
    wrapper.vm.email = 'test@test.com';
    wrapper.vm.verificationCode = '12356';
    for (let i = 0; i < 5; i++) {
      wrapper.vm.completeActivation();
    }

    expect(fetchStub.mock.calls.length).toBe(1);
  });

  describe('organization configuration', () => {
    it('does not show the prompt unless enabled by the host', () => {
      expect(wrapper.find('[data-cy="org-config-prompt"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="org-config-applied"]').exists()).toBe(false);
    });

    it('shows the prompt when enabled', () => {
      wrapper = shallowMount(SignIn, { propsData: { enableOrgConfig: true } });
      expect(wrapper.find('[data-cy="org-config-prompt"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="org-config-applied"]').exists()).toBe(false);
    });

    it('shows the confirmation banner (and hides prompt) when a configuration is already applied', () => {
      wrapper = shallowMount(SignIn, {
        propsData: { enableOrgConfig: true, orgConfigApplied: true },
      });
      expect(wrapper.find('[data-cy="org-config-prompt"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="org-config-applied"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="org-config-applied"]').text()).toContain(
        'Organization configuration applied.'
      );
    });

    it('emits apply-org-config on the root when the link is clicked', () => {
      wrapper = shallowMount(SignIn, { propsData: { enableOrgConfig: true } });
      const rootEmit = jest.spyOn(wrapper.vm.$root, '$emit');
      wrapper.find('[data-cy="org-config-link"]').trigger('click');
      expect(rootEmit).toHaveBeenCalledWith('apply-org-config');
    });

    it('replaces the prompt with a confirmation once applied', async () => {
      wrapper = shallowMount(SignIn, { propsData: { enableOrgConfig: true } });
      wrapper.vm.onOrgConfigApplied();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-cy="org-config-prompt"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="org-config-applied"]').text()).toContain(
        'Organization configuration applied.'
      );
    });
  });
});
