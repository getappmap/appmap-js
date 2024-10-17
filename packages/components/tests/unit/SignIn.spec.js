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
});
