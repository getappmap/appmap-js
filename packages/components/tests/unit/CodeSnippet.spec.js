import { mount } from '@vue/test-utils';
import CodeSnippet from '@/components/CodeSnippet.vue';

describe('CodeSnippet.vue', () => {
  let clipboardText;
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

  it('copies text when clicked', async () => {
    const clipboardText = 'This text will be copied to the clipboard';
    const wrapper = mount(CodeSnippet, {
      propsData: { clipboardText },
      mocks: { navigator },
    });

    const btn = wrapper.get('button');
    btn.element.disabled = false;
    btn.trigger('click');

    const actualClipboardText = await navigator.clipboard.readText();
    expect(actualClipboardText).toBe(clipboardText);
  });
});
