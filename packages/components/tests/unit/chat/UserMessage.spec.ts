// @ts-nocheck

import VUserMessage from '@/components/chat/UserMessage.vue';
import { URI } from '@appland/rpc';
import { createWrapper, mount } from '@vue/test-utils';
import { pinnedItemRegistry } from '../../../src/lib/pinnedItems';

const snippets = {
  tsCode: `\`\`\`ts
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
  afterEach(() => pinnedItemRegistry.clear());

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
      const uri = URI.random().toString();
      pinnedItemRegistry.appendContent(uri, snippets.tsCode);
      pinnedItemRegistry.setMetadata(uri, 'language', 'typescript');
      wrapper = mount(VUserMessage, {
        propsData: {
          tokens: [{ type: 'code-block', uri }],
        },
      });
      wrapper.vm.bindCopyButtons();
    });

    it('should display a copy button for all code snippets', () => {
      expect(wrapper.find('[data-cy="copy"]').exists()).toBe(true);
    });

    it('should copy text correctly from code snippets', () => {
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
          tokens: [snippets.htmlTag],
        },
      });
      expect(wrapper.get('[data-cy="message-text"]').text()).toBe(
        snippets.htmlTag.replace(/`/g, '')
      );
    });

    it('does not allow script injection', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          tokens: [snippets.xss],
        },
      });
      expect(wrapper.get('[data-cy="message-text"]').text()).not.toContain(snippets.xss);
    });

    it('renders the user message as plain text', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          tokens: [snippets.xss],
          isUser: true,
        },
      });
      expect(wrapper.get('[data-cy="message-text"]').text()).toBe(snippets.xss);
    });
  });

  describe('Save Button', () => {
    it('should emit a root event when clicked', async () => {
      const props = {
        id: 'id',
        isUser: false,
        threadId: 'threadId',
        tokens: ['Hello world!'],
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
          content: props.tokens[0],
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
          tokens: [snippets.tsCode],
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
      const uri = URI.random().toString();
      pinnedItemRegistry.appendContent(
        uri,
        '```mermaid\ngraph TD\nA[Birthday] -->|Get money| B(Go shopping)\n```'
      );
      pinnedItemRegistry.setMetadata(uri, 'language', 'mermaid');
      const wrapper = mount(VUserMessage, {
        propsData: {
          tokens: [{ type: 'code-block', uri }],
        },
      });

      expect(wrapper.find('[data-cy="mermaid-diagram"]').exists()).toBe(true);
    });
  });

  describe('code snippets', () => {
    it('renders code snippets with Windows paths', async () => {
      const uri = URI.file('C:\\Users\\me\\My Documents\\other-project\\src\\main.cpp');
      const wrapper = mount(VUserMessage, {
        propsData: {
          tokens: [{ type: 'code-block', uri: uri.toString() }],
        },
      });

      const title = wrapper.find('[data-cy="code-snippet"] [data-cy="context-title"]');
      expect(title.text()).toContain(uri.fsPath);
    });

    it('renders code snippets with Unix paths', async () => {
      const uri = URI.file('/home/user/dev/blog/src/index.js');
      const wrapper = mount(VUserMessage, {
        propsData: {
          tokens: [{ type: 'code-block', uri: uri.toString() }],
        },
      });

      const title = wrapper.find('[data-cy="code-snippet"] [data-cy="context-title"]');
      expect(title.text()).toContain(uri.fsPath);
    });
  });

  describe('next steps', () => {
    it('shows a skeleton loader if next steps are pending', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          tokens: ['Hello world!'],
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
          tokens: ['Hello world!'],
          complete: true,
          promptSuggestions: [
            { label: 'Do this', prompt: 'I will do this', command: 'do' },
            { label: 'Do that', prompt: 'I will do that', command: 'that' },
          ],
        },
      });
      expect(
        wrapper.findAll('[data-cy="next-step-button"]').wrappers.map((w) => w.text())
      ).toStrictEqual(['@do Do this', '@that Do that']);
    });

    it('automatically fetches next steps once the message is complete', async () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          tokens: ['Hello world!'],
          threadId: '00000000-0000-0000-0000-000000000000',
          isUser: false,
          complete: false,
        },
      });

      expect(wrapper.find('[data-cy="next-step-suggestions"]').exists()).toBe(false);

      await wrapper.setProps({ complete: true });

      expect(wrapper.find('[data-cy="next-step-suggestions"]').exists()).toBe(true);
    });
  });

  describe('links', () => {
    it('should open links to websites in a new tab', () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          tokens: ['[AppMap](https://appmap.io)'],
          complete: true,
          isUser: false,
        },
      });

      expect(wrapper.find('a[target="_blank"]').exists()).toBe(true);
    });

    it('emits a click-link event when a non-http(s) link is clicked', async () => {
      const wrapper = mount(VUserMessage, {
        propsData: {
          tokens: ['[my-file.md](my-file.md)'],
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
          tokens: [
            `- [\`my-file.md\`](${uri})
                    - [my-file.md](${uri})`,
          ],
          complete: true,
          isUser: false,
        },
      });

      expect(wrapper.findAll(`a[href="${uri}"]`).length).toBe(2);
    });
  });
});
