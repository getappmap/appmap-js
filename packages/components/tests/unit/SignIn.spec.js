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

  describe('server-supplied error messages', () => {
    const DENIAL_MESSAGE =
      'Sign-in is disabled for this email domain. Your organization licenses AppMap through a ' +
      'managed installation; please contact your IT department for access.';
    const GENERIC_ERROR_MSG = 'Something went wrong, please try again later.';

    // A minimal Response stand-in. `body` is what json() resolves to; pass a
    // rejecting json() to model a response that isn't JSON at all.
    const respond = (status, body) => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          status,
          json: typeof body === 'function' ? body : () => Promise.resolve(body),
        })
      );
    };

    const denial = { error: { code: 'sign_in_denied', message: DENIAL_MESSAGE } };
    const notJson = () => Promise.reject(new SyntaxError('Unexpected token < in JSON'));

    const activate = async () => {
      wrapper.vm.email = 'test@example.test';
      await wrapper.vm.activateWithEmail();
    };

    const verify = async () => {
      wrapper.vm.email = 'test@example.test';
      wrapper.vm.verificationCode = '123456';
      await wrapper.vm.completeActivation();
    };

    describe('when requesting an activation', () => {
      it('displays the message the server supplies', async () => {
        respond(403, denial);
        await activate();
        expect(wrapper.vm.error).toBe(DENIAL_MESSAGE);
      });

      it('stays on the activation screen so the message remains visible', async () => {
        respond(403, denial);
        await activate();
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.submitted).toBe(false);
        expect(wrapper.find('.error').text()).toBe(DENIAL_MESSAGE);
      });

      it('falls back to the field message when the response is not JSON', async () => {
        respond(422, notJson);
        await activate();
        expect(wrapper.vm.error).toBe('Invalid email address, please try again.');
      });

      it('falls back to the field message when the body carries no message', async () => {
        respond(422, { error: { code: 'unprocessable' } });
        await activate();
        expect(wrapper.vm.error).toBe('Invalid email address, please try again.');
      });

      it('falls back to the field message when the message is blank or not a string', async () => {
        respond(422, { error: { message: '   ' } });
        await activate();
        expect(wrapper.vm.error).toBe('Invalid email address, please try again.');

        respond(422, { error: { message: { nested: 'object' } } });
        await activate();
        expect(wrapper.vm.error).toBe('Invalid email address, please try again.');
      });

      it('does not surface a message from a server error', async () => {
        respond(500, { error: { message: 'ActiveRecord::StatementInvalid in Activations' } });
        await activate();
        expect(wrapper.vm.error).toBe(GENERIC_ERROR_MSG);
      });
    });

    describe('when verifying the code', () => {
      it('displays the message the server supplies', async () => {
        respond(403, denial);
        await verify();
        expect(wrapper.vm.error).toBe(DENIAL_MESSAGE);
      });

      it('falls back to the field message when the response is not JSON', async () => {
        respond(422, notJson);
        await verify();
        expect(wrapper.vm.error).toBe('Invalid verification code, please try again.');
      });

      it('falls back to the field message when the body carries no message', async () => {
        respond(422, { error: { code: 'unprocessable' } });
        await verify();
        expect(wrapper.vm.error).toBe('Invalid verification code, please try again.');
      });

      it('does not surface a message from a server error', async () => {
        respond(500, { error: { message: 'ActiveRecord::StatementInvalid' } });
        await verify();
        expect(wrapper.vm.error).toBe(GENERIC_ERROR_MSG);
      });
    });
  });

  describe('the email input', () => {
    const EMAIL = 'test@example.test';

    const failWith = (fetchImpl) => {
      global.fetch = jest.fn(fetchImpl);
    };

    const activate = async () => {
      wrapper.vm.email = EMAIL;
      await wrapper.vm.activateWithEmail();
    };

    it('keeps the address when the server denies it', async () => {
      failWith(() =>
        Promise.resolve({
          status: 403,
          json: () => Promise.resolve({ error: { message: 'Sign-in is disabled.' } }),
        })
      );
      await activate();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.email).toBe(EMAIL);
      expect(wrapper.find('#email-input').element.value).toBe(EMAIL);
    });

    it('keeps the address when the server errors', async () => {
      failWith(() => Promise.resolve({ status: 500, json: () => Promise.resolve({}) }));
      await activate();
      expect(wrapper.vm.email).toBe(EMAIL);
    });

    it('keeps the address when the request fails outright', async () => {
      failWith(() => Promise.reject(new TypeError('Failed to fetch')));
      await activate();
      expect(wrapper.vm.email).toBe(EMAIL);
    });

    it('is cleared by "try again" from the verification screen', async () => {
      wrapper.vm.email = EMAIL;
      wrapper.vm.submitted = true;
      wrapper.vm.reset();
      expect(wrapper.vm.email).toBe('');
      expect(wrapper.vm.submitted).toBe(false);
    });
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
