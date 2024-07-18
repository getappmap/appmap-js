import VUserMessage from '@/components/chat/UserMessage.vue';
import { mount } from '@vue/test-utils';

const snippets = {
  tsCode: `Here's some code:
\`\`\`ts
const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
  { renderer: customRenderer }
);
\`\`\`
`,
  htmlTag: '`<!DOCTYPE html>`',
  xss: '<script>alert("hello world!")</script>',
};

describe('components/UserMessage.vue', () => {
  describe('Copy Button for Code Snippets', () => {
    let wrapper;
    let clipboardText;
    beforeEach(async () => {
      Object.assign(navigator, {
        clipboard: {
          async writeText(val) {
            clipboardText = val;
            return Promise.resolve();
          },
          async readText() {
            return Promise.resolve(clipboardText);
          },
        },
      });
      wrapper = mount(VUserMessage, {
        propsData: {
          message: snippets.tsCode,
        },
      });
      wrapper.vm.bindCopyButtons();
    });

    it('should display a copy button for all code snippets', () => {
      expect(wrapper.find('[data-cy="copy"]').exists()).toBe(true);
    });

    it('should copy text correctly from code snippets', () => {
      const codeSnippetElement = wrapper.get('[data-cy="code-snippet"]');

      wrapper.get('[data-cy="copy"]').trigger('click');
      return expect(navigator.clipboard.readText()).resolves.toBe(`const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
  { renderer: customRenderer }
);`);
    });
  });

  describe('DOM sanitization', () => {
    it('allows html-like elements in preformatted blocks', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: snippets.htmlTag,
        },
      });
      expect(wrapper.get('[data-cy="message-text"]').text()).toBe(
        snippets.htmlTag.replace(/`/g, '')
      );
    });

    it('does not allow script injection', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: snippets.xss,
        },
      });
      expect(wrapper.get('[data-cy="message-text"]').text()).not.toContain(snippets.xss);
    });

    it('renders the user message as plain text', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: snippets.xss,
          isUser: true,
        },
      });
      expect(wrapper.get('[data-cy="message-text"]').text()).toBe(snippets.xss);
    });
  });

  describe('Message Feedback Buttons', () => {
    it('should not display feedback buttons if the message is unidentified', () => {
      const wrapper = mount(VUserMessage);
      expect(wrapper.find('[data-cy="feedback-good"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="feedback-bad"]').exists()).toBe(false);
    });

    it('should display feedback buttons after an identified system message', () => {
      const wrapper = mount(VUserMessage, { propsData: { id: 'id' } });
      expect(wrapper.find('[data-cy="feedback-good"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="feedback-bad"]').exists()).toBe(true);
    });

    it('does not display feedback buttons after a user message', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          isUser: true,
        },
      });
      expect(wrapper.find('[data-cy="feedback-good"]').exists()).not.toBe(true);
      expect(wrapper.find('[data-cy="feedback-bad"]').exists()).not.toBe(true);
    });

    it('emits an event when clicking the feedback buttons', () => {
      const messageId = '123';
      const wrapper = mount(VUserMessage, {
        propsData: {
          id: messageId,
        },
      });
      wrapper.find('[data-cy="feedback-good"]').trigger('click');

      // Clear the timer that represents the timeout for sending feedback again
      wrapper.vm.sentimentTimeout = undefined;

      wrapper.find('[data-cy="feedback-bad"]').trigger('click');

      const events = wrapper.emitted()['change-sentiment'];
      expect(events).toBeArrayOfSize(2);
      expect(events[0]).toEqual([messageId, 1]);
      expect(events[1]).toEqual([messageId, -1]);
    });

    it('throttles feedback button clicks', () => {
      const wrapper = mount(VUserMessage, { propsData: { id: '123' } });
      for (let i = 0; i < 3; i++) {
        wrapper.find('[data-cy="feedback-good"]').trigger('click');
      }
      expect(wrapper.emitted()['change-sentiment']).toBeArrayOfSize(1);
    });

    it('sends the correct sentiment value if the button is clicked again', () => {
      const wrapper = mount(VUserMessage, { propsData: { id: '123', sentiment: 1 } });
      wrapper.find('[data-cy="feedback-good"]').trigger('click');
      const [, sentiment] = wrapper.emitted()['change-sentiment'][0];
      expect(sentiment).toEqual(0);
    });

    it('should change button state', async () => {
      const wrapper = mount(VUserMessage, { propsData: { id: '123' } });
      expect(wrapper.find('.sentiment--selected[data-cy="feedback-good"]').exists()).toBe(false);
      expect(wrapper.find('.sentiment--selected[data-cy="feedback-bad"]').exists()).toBe(false);

      wrapper.setProps({ sentiment: 1 });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.sentiment--selected[data-cy="feedback-good"]').exists()).toBe(true);
      expect(wrapper.find('.sentiment--selected[data-cy="feedback-bad"]').exists()).toBe(false);

      wrapper.setProps({ sentiment: 0 });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.sentiment--selected[data-cy="feedback-good"]').exists()).toBe(false);
      expect(wrapper.find('.sentiment--selected[data-cy="feedback-bad"]').exists()).toBe(false);

      wrapper.setProps({ sentiment: -1 });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.sentiment--selected[data-cy="feedback-good"]').exists()).toBe(false);
      expect(wrapper.find('.sentiment--selected[data-cy="feedback-bad"]').exists()).toBe(true);
    });
  });

  describe('Copy Button for entire message', () => {
    let wrapper;
    let clipboardText;

    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          async writeText(val) {
            clipboardText = val;
            return Promise.resolve();
          },
          async readText() {
            return Promise.resolve(clipboardText);
          },
        },
      });
      wrapper = mount(VUserMessage, {
        propsData: {
          message: snippets.tsCode,
          id: 'id',
        },
      });
    });

    it('copies the entire message when the copy button is clicked', () => {
      wrapper.get('[data-cy="copy-message"]').trigger('click');
      return expect(navigator.clipboard.readText()).resolves.toBe(snippets.tsCode.trim());
    });

    it('shows a check icon for 2.5s when the code is copied', async () => {
      expect(wrapper.find('.copy-icon').exists()).toBe(true);

      // click the copy button
      await wrapper.get('[data-cy="copy-message"]').trigger('click');

      // check that the check icon is displayed
      expect(wrapper.find('.copy-icon').exists()).toBe(false);
      expect(wrapper.find('.check-icon').exists()).toBe(true);

      // wait for check to go away
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // check that the copy icon is displayed
      expect(wrapper.find('.check-icon').exists()).toBe(false);
      expect(wrapper.find('.copy-icon').exists()).toBe(true);
    });
  });

  describe('mermaid', () => {
    it('renders a diagram', async () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: '```mermaid\ngraph TD\nA[Birthday] -->|Get money| B(Go shopping)\n```',
        },
      });

      expect(wrapper.find('[data-cy="mermaid-diagram"]').exists()).toBe(true);
    });
  });
});
