import VUserMessage from '@/components/chat/UserMessage.vue';
import { createWrapper, mount } from '@vue/test-utils';

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
);
`);
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
      const wrapper = mount(VUserMessage, { propsData: { id: 'id', complete: true } });
      expect(wrapper.find('[data-cy="feedback-good"]').exists()).toBe(true);
      expect(wrapper.find('[data-cy="feedback-bad"]').exists()).toBe(true);
    });

    it('does not display feedback buttons until the message is complete', () => {
      const wrapper = mount(VUserMessage, { propsData: { id: 'id', isUser: 'false' } });
      expect(wrapper.find('[data-cy="feedback-good"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="feedback-bad"]').exists()).toBe(false);
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
          complete: true,
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
      const wrapper = mount(VUserMessage, { propsData: { id: '123', complete: true } });
      for (let i = 0; i < 3; i++) {
        wrapper.find('[data-cy="feedback-good"]').trigger('click');
      }
      expect(wrapper.emitted()['change-sentiment']).toBeArrayOfSize(1);
    });

    it('sends the correct sentiment value if the button is clicked again', () => {
      const wrapper = mount(VUserMessage, {
        propsData: { id: '123', sentiment: 1, complete: true },
      });
      wrapper.find('[data-cy="feedback-good"]').trigger('click');
      const [, sentiment] = wrapper.emitted()['change-sentiment'][0];
      expect(sentiment).toEqual(0);
    });

    it('should change button state', async () => {
      const wrapper = mount(VUserMessage, { propsData: { id: '123', complete: true } });
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

  describe('Save Button', () => {
    it('should emit a root event when clicked', async () => {
      const props = {
        id: 'id',
        isUser: false,
        threadId: 'threadId',
        message: 'Hello world!',
        complete: true,
      };

      const wrapper = mount(VUserMessage, { propsData: props });
      const saveButton = wrapper.find('[data-cy="save-message"]');
      await saveButton.trigger('click');

      const rootWrapper = createWrapper(wrapper.vm.$root);
      expect(rootWrapper.emitted()['save-message']).toBeTruthy();
      expect(rootWrapper.emitted()['save-message'][0]).toEqual([
        {
          messageId: props.id,
          threadId: props.threadId,
          content: props.message,
        },
      ]);
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
          complete: true,
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
      expect(wrapper.find('[data-cy="copy-message"] [data-cy="copy-icon"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="copy-message"] [data-cy="check-icon"]').exists()).toBe(true);

      // wait for check to go away
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // check that the copy icon is displayed
      expect(wrapper.find('[data-cy="copy-message"] [data-cy="check-icon"]').exists()).toBe(false);
      expect(wrapper.find('[data-cy="copy-message"] [data-cy="copy-icon"]').exists()).toBe(true);
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

  describe('code snippets', () => {
    it('renders code snippets with Windows paths', async () => {
      const path = 'C:\\Users\\me\\My Documents\\other-project\\src\\main.cpp';
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: `\n<!-- file: ${path} -->\n\`\`\`cpp\n\n\`\`\``,
        },
      });

      const title = wrapper.find('[data-cy="code-snippet"] [data-cy="context-title"]');
      expect(title.text()).toContain(path);
    });

    it('renders code snippets with Unix paths', async () => {
      const path = '/home/user/dev/blog/src/index.js';
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: `<!-- file: ${path} -->\n\`\`\`js\n\n\`\`\``,
        },
      });

      const title = wrapper.find('[data-cy="code-snippet"] [data-cy="context-title"]');
      expect(title.text()).toContain(path);
    });

    it('renders code snippet paths with a preceding file directive', async () => {
      const path = '/home/user/dev/blog/src/index.js';
      const sourceText = '{\n}';
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: `<!-- file: ${path} -->\n\`\`\`js\n${sourceText}\n\`\`\``,
        },
      });

      const title = wrapper.find('[data-cy="code-snippet"] [data-cy="context-title"]');
      const codeSnippet = wrapper.find('[data-cy="code-snippet"] [data-cy="content"]');
      expect(title.text()).toContain(path);
      expect(codeSnippet.text()).toEqual(sourceText);
    });

    it('renders code snippet paths with an inner file directive', async () => {
      const path = '/home/user/dev/blog/src/index.js';
      const sourceText = '{\n}';
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: `\`\`\`js\n<!-- file: ${path} -->\n${sourceText}\n\`\`\``,
        },
      });

      const title = wrapper.find('[data-cy="code-snippet"] [data-cy="context-title"]');
      const codeSnippet = wrapper.find('[data-cy="code-snippet"] [data-cy="content"]');
      expect(title.text()).toContain(path);
      expect(codeSnippet.text()).toEqual(sourceText);
    });

    it('removes the file directive from the code snippet while streaming', async () => {
      const sourceText = '{\n}';
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: `\`\`\`js\n<!-- file: /home/user/dev/blog/src/index.js -->\n${sourceText}`,
        },
      });

      const title = wrapper.find('[data-cy="code-snippet"] [data-cy="context-title"]');
      const codeSnippet = wrapper.find('[data-cy="code-snippet"] [data-cy="content"]');
      expect(title.text()).toContain('js');
      expect(codeSnippet.text()).toEqual(sourceText);
    });
  });

  describe('next steps', () => {
    it('shows a skeleton loader if next steps are pending', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: 'Hello world!',
          complete: true,
        },
      });
      expect(wrapper.find('[data-cy="next-step-suggestions"]:not([data-fetched])').exists()).toBe(
        true
      );
      expect(wrapper.find('[data-cy="next-step-button"]').exists()).toBe(false);
    });

    it('displays next steps once they are fetched', async () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: 'Hello world!',
          complete: true,
        },
        data: () => ({
          nextStepSuggestions: [
            { label: 'Do this', prompt: 'I will do this', command: 'do' },
            { label: 'Do that', prompt: 'I will do that', command: 'that' },
          ],
        }),
      });
      expect(
        wrapper.findAll('[data-cy="next-step-button"]').wrappers.map((w) => w.text())
      ).toStrictEqual(['@do Do this', '@that Do that']);
    });

    it('automatically fetches next steps once the message is complete', async () => {
      const suggest = jest.fn();
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: 'Hello world!',
          threadId: '00000000-0000-0000-0000-000000000000',
          isUser: false,
          complete: false,
        },
        provide: {
          rpcClient: { suggest },
        },
      });

      expect(wrapper.find('[data-cy="next-step-suggestions"]').exists()).toBe(false);
      expect(suggest).not.toHaveBeenCalled();

      await wrapper.setProps({ complete: true });

      expect(suggest).toHaveBeenCalled();
      expect(wrapper.find('[data-cy="next-step-suggestions"]').exists()).toBe(true);
    });
  });

  describe('links', () => {
    it('should open links to websites in a new tab', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: '[AppMap](https://appmap.io)',
          complete: true,
          isUser: false,
        },
      });

      expect(wrapper.find('a[target="_blank"]').exists()).toBe(true);
    });

    it('emits a click-link event when a non-http(s) link is clicked', async () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: '[my-file.md](my-file.md)',
          complete: true,
          isUser: false,
        },
      });
      const rootWrapper = createWrapper(wrapper.vm.$root);

      await wrapper.find('a[emit-event]').trigger('click');

      const events = rootWrapper.emitted()['click-link'];
      expect(events).toBeArrayOfSize(1);
      expect(events[0]).toEqual(['my-file.md']);
    });

    it('allows the file protocol', () => {
      const uri = 'file:///home/user/my-file.md';
      const wrapper = mount(VUserMessage, {
        propsData: {
          message: `- [\`my-file.md\`](${uri})
                    - [my-file.md](${uri})`,
          complete: true,
          isUser: false,
        },
      });

      expect(wrapper.findAll(`a[href="${uri}"]`).length).toBe(2);
    });
  });
});
