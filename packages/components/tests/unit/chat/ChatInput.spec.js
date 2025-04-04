import VChatInput from '@/components/chat/ChatInput.vue';
import { mount } from '@vue/test-utils';

describe('ChatInput', () => {
  let caretPosition = undefined;
  let wrapper;

  beforeEach(() => {
    document.getSelection = jest.fn().mockImplementation(() => ({ focusOffset: caretPosition }));
    wrapper = mount(VChatInput, {
      propsData: {
        commands: [
          {
            name: '@example',
            description: 'An example command',
          },
        ],
      },
    });
  });

  afterEach(() => {
    caretPosition = undefined;
    jest.resetAllMocks();
  });

  it('does not emit a send event if stop is active', async () => {
    await wrapper.setProps({ isStopActive: true });
    wrapper.vm.send();

    expect(wrapper.emitted('send')).toBeUndefined();
  });

  it('opens an autocomplete when "@" is typed', async () => {
    expect(wrapper.find('[data-cy="autocomplete"]').exists()).toBe(false);

    caretPosition = 1;
    await wrapper.setData({ input: '@' });

    expect(wrapper.find('[data-cy="autocomplete"]').isVisible()).toBe(true);
  });

  it('emits a send event if the user is not typing a command', async () => {
    await wrapper.setData({ input: 'hello' });
    wrapper.vm.send();

    expect(wrapper.emitted('send')).toStrictEqual([['hello']]);
  });

  it('does not emit a send event when the user is typing a command', async () => {
    caretPosition = 1;
    await wrapper.setData({ input: '@' });
    wrapper.vm.send();

    expect(wrapper.emitted('send')).toBeUndefined();
  });

  it('is not editable when disabled', async () => {
    await wrapper.setProps({ isDisabled: true });
    expect(wrapper.find('[data-cy="chat-input"]').attributes('contenteditable')).toBe('false');
  });

  it('is editable when not disabled', async () => {
    await wrapper.setProps({ isDisabled: false });
    expect(wrapper.find('[data-cy="chat-input"]').attributes('contenteditable')).toBe(
      'plaintext-only'
    );
  });

  describe('usage indicator', () => {
    const messageRegex = (numThreads) =>
      new RegExp(`You've used\\s+${numThreads}\\s+of\\s+your\\s+7\\s+chat sessions`);

    it('is not displayed before the subscription is loaded', async () => {
      await wrapper.setProps({ subscription: undefined });
      expect(wrapper.find('[data-cy="usage-message"]').exists()).toBe(false);
    });

    it('is not displayed if a subscription is present', async () => {
      await wrapper.setProps({
        subscription: { subscriptions: [{ productName: 'AppMap Pro' }] },
        usage: { conversationCounts: [{ daysAgo: 7, count: 7 }] },
      });
      expect(wrapper.find('[data-cy="usage-message"]').exists()).toBe(false);
    });

    it('is not displayed at zero chats', async () => {
      await wrapper.setProps({
        usage: { conversationCounts: [{ daysAgo: 7, count: 0 }] },
        subscription: {},
      });
      expect(wrapper.find('[data-cy="usage-message"]').exists()).toBe(false);
    });

    it('is displayed when above the limit', async () => {
      const count = 8;
      await wrapper.setProps({
        usage: { conversationCounts: [{ daysAgo: 7, count }] },
        subscription: {},
      });
      expect(wrapper.find('[data-cy="usage-message"]').text()).toMatch(messageRegex(count));
      expect(
        wrapper.find('[data-cy="usage-message"][data-usage="overLimit"]').exists()
      ).toBeTruthy();
    });

    it('is displayed when nearing the limit', async () => {
      const count = 6;
      await wrapper.setProps({
        usage: { conversationCounts: [{ daysAgo: 7, count }] },
        subscription: {},
      });
      expect(wrapper.find('[data-cy="usage-message"]').text()).toMatch(messageRegex(count));
      expect(
        wrapper.find('[data-cy="usage-message"][data-usage="withinLimits"]').exists()
      ).toBeTruthy();
    });

    it('is displayed when at the limit', async () => {
      const count = 7;
      await wrapper.setProps({
        usage: { conversationCounts: [{ daysAgo: 7, count }] },
        subscription: {},
      });
      expect(wrapper.find('[data-cy="usage-message"]').text()).toMatch(messageRegex(count));
      expect(
        wrapper.find('[data-cy="usage-message"][data-usage="atMaxLimit"]').exists()
      ).toBeTruthy();
    });

    it('is not displayed when displaySubscription feature flag is false', async () => {
      const wrapper = mount(VChatInput, {
        propsData: {
          usage: { conversationCounts: [{ daysAgo: 7, count: 7 }] },
          subscription: {},
        },
        provide: {
          displaySubscription: false,
        },
      });
      expect(wrapper.find('[data-cy="usage-message"]').exists()).toBeFalsy();
    });

    it('includes the email in the subscribe url', async () => {
      const wrapper = mount(VChatInput, {
        propsData: {
          usage: { conversationCounts: [{ daysAgo: 7, count: 7 }] },
          email: 'test@example.com',
        },
      });
      expect(wrapper.find('[data-cy="usage-message"] a').attributes('href')).toStrictEqual(
        'https://getappmap.com/?email=test%40example.com'
      );
    });

    it('omits the email in the subscribe url when not provided', async () => {
      const wrapper = mount(VChatInput, {
        propsData: {
          usage: { conversationCounts: [{ daysAgo: 7, count: 7 }] },
        },
      });
      expect(wrapper.find('[data-cy="usage-message"] a').attributes('href')).toStrictEqual(
        'https://getappmap.com'
      );
    });
  });
});
